/**
 * Data Models: DỮ LIỆU ĐIỂM THÔ (RAW GRADES)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Nhóm type này tách hẳn khỏi model nghiệp vụ (course/student/result):
 * - Đây là dữ liệu "vận chuyển" đọc từ file Excel điểm thô (cột điểm, ký hiệu điểm danh).
 * - Sau khi đọc xong, dữ liệu được chuyển thành `Student` + `StudentCourseScoreRecord`
 *   (xem `io/rawGradesParser/toStudentRecords`).
 */

import type { ScoreValue, Student } from './student'

/** Thông tin lớp đọc từ phần đầu file điểm thô. */
export interface RawGradesMeta {
  tenHocPhan?: string
  maHp?: string
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
}

/** Điểm thô của một sinh viên theo từng cột điểm (mã cột = `ExamQuestion.id`). */
export interface RawStudentScores {
  /** Mã đề sinh viên làm; rỗng hoặc 'ALL' = làm mọi đề. */
  maDe?: string
  diemCacCot: Record<string, ScoreValue>
  ghiChu?: string
}

/** Một dòng sinh viên trong file điểm thô. */
export interface RawStudentRow {
  student: Student
  scores: RawStudentScores
}

/** Ký hiệu điểm danh thô của một sinh viên theo nhãn buổi. */
export interface RawAttendanceRecord {
  maSv: string
  symbols: Record<string, string>
}

/** Một cột điểm danh phát hiện trong header file điểm thô. */
export interface RawAttendanceSession {
  column: string
  label: string
}

/** Toàn bộ file điểm thô đã đọc (chưa ánh xạ sang model nghiệp vụ). */
export interface RawGrades {
  meta: RawGradesMeta
  students: RawStudentRow[]
  attendance: RawAttendanceRecord[]
  attendanceSessions: RawAttendanceSession[]
  declaredMaxScores: Record<string, number>
  studentExcelRows?: number[]
}

/** Điểm chuyên cần tính được từ ký hiệu điểm danh của một sinh viên. */
export interface AttendanceScore {
  maSv: string
  score: number
  soBuoi: number
  soVangKhongPhep: number
  soVangCoPhep: number
  symbolsLa: string[]
}
