/**
 * Chuyển dữ liệu điểm thô (RawGrades) sang model nghiệp vụ:
 *   Student[] + StudentCourseScoreRecord[]
 *
 * Mỗi đợt đánh giá trong Course sinh ra một entry tương ứng:
 * - QUESTION_SCORE   : lấy điểm theo `ExamQuestion.id` (mã cột Excel)
 * - DIRECT_CLO_SCORE : cột `<đợt>_<CLO>` hoặc cột `<đợt>`
 * - ATTENDANCE       : lấy ký hiệu điểm danh theo buổi
 */

import type {
  AssessmentComponent,
  AssessmentAttendanceSession,
  Course,
  ExamVariant,
  RawGrades,
  Student,
  StudentAssessmentEntry,
  StudentCourseScoreRecord
} from '../../types'

export interface ParsedCourseData {
  students: Student[]
  records: StudentCourseScoreRecord[]
}

function chooseVariant(dot: AssessmentComponent, maDe?: string): ExamVariant | undefined {
  if (maDe && maDe !== 'ALL') {
    const found = dot.maDeList.find((v) => v.id === maDe || v.maDe === maDe)
    if (found) return found
  }
  return dot.maDeList[0]
}

function attendanceSessionsOf(
  dot: AssessmentComponent,
  file: RawGrades
): AssessmentAttendanceSession[] {
  if (dot.buoiDiemDanh && dot.buoiDiemDanh.length > 0) return dot.buoiDiemDanh
  return file.attendanceSessions.map((session) => ({
    id: session.label,
    tenBuoi: session.label
  }))
}

export function buildStudentRecords(course: Course, file: RawGrades): ParsedCourseData {
  const symbolsByMaSv = new Map(file.attendance.map((a) => [a.maSv, a.symbols]))
  const students = file.students.map((row) => row.student)
  const records = file.students.map((row) => {
    const symbols = symbolsByMaSv.get(row.student.maSv) ?? {}
    const entries: StudentAssessmentEntry[] = []

    for (const dot of course.dotDanhGia) {
      if (dot.cachNhapDiem === 'QUESTION_SCORE') {
        const variant = chooseVariant(dot, row.scores.maDe)
        const deId =
          row.scores.maDe === 'ALL' && dot.maDeList.length > 1 ? 'ALL' : (variant?.id ?? 'ALL')
        const questions =
          deId === 'ALL' ? dot.maDeList.flatMap((v) => v.cauHoi) : (variant?.cauHoi ?? [])

        entries.push({
          cachNhapDiem: 'QUESTION_SCORE',
          dotDanhGiaId: dot.id,
          deId,
          diemTheoCau: questions.map((q) => ({
            questionId: q.id,
            diem: row.scores.diemCacCot[q.id] ?? null
          }))
        })
      } else if (dot.cachNhapDiem === 'DIRECT_CLO_SCORE') {
        entries.push({
          cachNhapDiem: 'DIRECT_CLO_SCORE',
          dotDanhGiaId: dot.id,
          diemTheoClo: dot.cloList.map((mapping) => ({
            cloId: mapping.cloId,
            diem:
              row.scores.diemCacCot[`${dot.id}_${mapping.cloId}`] ??
              row.scores.diemCacCot[dot.id] ??
              null
          }))
        })
      } else {
        const sessions = attendanceSessionsOf(dot, file)
        entries.push({
          cachNhapDiem: 'ATTENDANCE',
          dotDanhGiaId: dot.id,
          diemDanh: sessions.map((session) => ({
            buoiDiemDanhId: session.id,
            kyHieu: symbols[session.tenBuoi] ?? ''
          }))
        })
      }
    }

    return {
      id: `${row.student.id}_${course.id}`,
      sinhVienId: row.student.id,
      hocPhanId: course.id,
      diemTheoDotDanhGia: entries,
      ghiChu: row.scores.ghiChu
    }
  })

  return { students, records }
}
