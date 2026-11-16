/**
 * Chuyển dữ liệu điểm thô (GradeSheetData) sang model nghiệp vụ:
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
  GradeSheetData,
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
  file: GradeSheetData
): AssessmentAttendanceSession[] {
  if (dot.buoiDiemDanh && dot.buoiDiemDanh.length > 0) return dot.buoiDiemDanh
  return file.buoiDiemDanh.map((tenBuoi) => ({
    id: tenBuoi,
    tenBuoi
  }))
}

export function buildStudentRecords(course: Course, file: GradeSheetData): ParsedCourseData {
  const students = file.sinhVien.map((row) => row.sinhVien)
  const records = file.sinhVien.map((row) => {
    const symbols = row.diemDanh ?? {}
    const entries: StudentAssessmentEntry[] = []

    for (const dot of course.dotDanhGia) {
      if (dot.cachNhapDiem === 'QUESTION_SCORE') {
        const maDe = row.diem.maDeTheoDauDiem?.[dot.id]
        const variant = chooseVariant(dot, maDe)
        const deId = maDe === 'ALL' && dot.maDeList.length > 1 ? 'ALL' : (variant?.id ?? 'ALL')
        const questions =
          deId === 'ALL' ? dot.maDeList.flatMap((v) => v.cauHoi) : (variant?.cauHoi ?? [])

        entries.push({
          cachNhapDiem: 'QUESTION_SCORE',
          dotDanhGiaId: dot.id,
          deId,
          diemTheoCau: questions.map((q) => ({
            questionId: q.id,
            diem: row.diem.diemCacCot[q.id] ?? null
          }))
        })
      } else if (dot.cachNhapDiem === 'DIRECT_CLO_SCORE') {
        entries.push({
          cachNhapDiem: 'DIRECT_CLO_SCORE',
          dotDanhGiaId: dot.id,
          diemTheoClo: dot.cloList.map((mapping) => ({
            cloId: mapping.cloId,
            diem:
              row.diem.diemCacCot[`${dot.id}_${mapping.cloId}`] ??
              row.diem.diemCacCot[dot.id] ??
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
      id: `${row.sinhVien.id}_${course.id}`,
      sinhVienId: row.sinhVien.id,
      hocPhanId: course.id,
      diemTheoDotDanhGia: entries,
      ghiChu: row.ghiChu
    }
  })

  return { students, records }
}
