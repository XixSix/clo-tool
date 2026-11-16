/**
 * Data Models: DỮ LIỆU BẢNG ĐIỂM NHẬP VÀO (GRADE SHEET)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Nhóm type này tách hẳn khỏi model nghiệp vụ (course/student/result):
 * - Đây là dữ liệu "vận chuyển" đọc từ file Excel bảng điểm (cột điểm, ký hiệu điểm danh).
 * - Sau khi đọc xong, dữ liệu được chuyển thành `Student` + `StudentCourseScoreRecord`
 *   (xem `io/gradeSheetParser/toStudentRecords`).
 *
 * Quy ước đặt tên: type/interface tiếng Anh, field nghiệp vụ tiếng Việt camelCase
 * (giống `course.ts`, `student.ts`).
 */

import type { ScoreValue, Student } from './student'

/** Thông tin lớp đọc từ phần đầu file bảng điểm. */
export interface GradeSheetMeta {
  tenHocPhan?: string
  maHp?: string
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
}

/**
 * Điểm của một sinh viên đọc từ file bảng điểm.
 *
 * `diemCacCot` gom mọi cột điểm của dòng (trừ cột định danh và điểm danh) theo
 * **mã cột** (string). Mã cột chính là:
 * - `ExamQuestion.id` nếu đợt nhập theo câu (`QUESTION_SCORE`);
 * - `"{đợt.id}_{cloId}"` hoặc `đợt.id` nếu đợt nhập điểm trực tiếp CLO (`DIRECT_CLO_SCORE`).
 */
export interface SheetStudentScores {
  /**
   * Mã đề riêng theo từng đợt đánh giá (key = `AssessmentComponent.id`).
   *
   * Dùng cho đợt nhập theo câu; ví dụ GK làm đề D1, CK làm đề D3. Nếu một SV
   * làm cùng một đề cho mọi đợt thì điền cùng giá trị cho mọi khóa.
   */
  maDeTheoDauDiem?: Record<string, string>
  diemCacCot: Record<string, ScoreValue>
}

/** Một dòng sinh viên trong file bảng điểm. */
export interface SheetStudentRow {
  sinhVien: Student
  diem: SheetStudentScores
  /** Ký hiệu điểm danh theo từng buổi (key = tên buổi, value = ký hiệu vd: 'X', 'V'). */
  diemDanh?: Record<string, string>
  ghiChu?: string
}

/** Toàn bộ file bảng điểm đã đọc (chưa ánh xạ sang model nghiệp vụ). */
export interface GradeSheetData {
  /** Thông tin lớp ở phần đầu file. */
  thongTin: GradeSheetMeta
  /** Danh sách dòng sinh viên (kèm điểm số và điểm danh). */
  sinhVien: SheetStudentRow[]
  /** Tên các buổi điểm danh (cột) phát hiện trong header file bảng điểm. */
  buoiDiemDanh: string[]
  /** Điểm tối đa khai báo ở hàng "Điểm tối đa" (nếu file có). */
  diemToiDaKhaiBao: Record<string, number>
  /** Số dòng Excel thật của từng sinh viên (để báo lỗi đúng vị trí). */
  dongExcelSinhVien?: number[]
}
