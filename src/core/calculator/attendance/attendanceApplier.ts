import type { CourseConfig, RawGrades, ValidationIssue } from '../../types'
import { computeAttendanceScores } from './attendanceCalculator'

export interface ApplyAttendanceResult {
  file: RawGrades
  issues: ValidationIssue[]
}

/** Gắn điểm chuyên cần tự tính vào cột điểm tương ứng của từng sinh viên. */
export function applyAttendance(
  file: RawGrades,
  config: CourseConfig,
  columnCode = 'CC'
): ApplyAttendanceResult {
  const rules = config.diemDanh
  if (!rules || rules.length === 0 || file.attendanceSessions.length === 0) {
    return { file, issues: [] }
  }

  const { byMaSv, issues } = computeAttendanceScores(file.attendance, rules)
  const students = file.students.map((st) => {
    const score = byMaSv[st.student.maSv]
    if (score === undefined) return st

    const current = st.scores.diemCacCot[columnCode]
    if (typeof current === 'number' && Math.abs(current - score) >= 0.1) {
      issues.push({
        level: 'warning',
        message: `SV ${st.student.maSv}: điểm ${columnCode} nhập tay (${current}) lệch với điểm danh tự tính (${score}).`,
        suggestion: 'App dùng điểm tính từ điểm danh; kiểm tra lại nếu muốn giữ điểm nhập tay.'
      })
    }

    return {
      ...st,
      scores: {
        ...st.scores,
        diemCacCot: { ...st.scores.diemCacCot, [columnCode]: score }
      }
    }
  })

  return { file: { ...file, students }, issues }
}
