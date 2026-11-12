/**
 * Data Models: DỮ LIỆU ĐIỂM THÔ & HỒ SƠ SINH VIÊN (RAW INPUT)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 */

/** 1. Thông tin lớp học phần (khối header đầu file điểm thô) */
export interface RawGradesMeta {
  tenHocPhan?: string
  maHp?: string
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
}

/** 2. Thông tin một cột điểm danh trong file */
export interface AttendanceSession {
  column: string
  label: string // Ví dụ: "Buổi 1", "Buổi 1 (28/10)", "28/10"
}

/** 3. Dữ liệu điểm danh của một sinh viên */
export interface AttendanceRecord {
  maSv: string
  /** key = label của buổi, value = ký hiệu (X, V, P, M...) */
  symbols: Record<string, string>
}

/** 4. Thông tin định danh của sinh viên */
export interface StudentInfo {
  tt: number
  maSv: string
  ho: string
  ten: string
  hoTen: string // ghép từ "ho ten", tiện hiển thị & tìm kiếm
  ngaySinh?: string
}

/** 5. Dữ liệu làm bài & điểm thô của sinh viên */
export interface StudentScores {
  maDe?: string
  /**
   * Mã đề riêng theo từng mã đầu điểm (dùng khi ghép 2 giai đoạn: CK lấy mã đề từ
   * file cuối kỳ, còn CC/GK giữ nguyên từ file quá trình). Thiếu khóa nào thì
   * dùng `maDe` chung như hành vi cũ.
   */
  maDeTheoDauDiem?: Record<string, string>
  diemCacCot: Record<string, number | 'VT' | null | undefined>
  ghiChu?: string
}

/** 6. Một dòng sinh viên trong file điểm thô (Phương án 2A - Composition) */
export interface RawStudentRow {
  student: StudentInfo
  scores: StudentScores
}

/** 7. Toàn bộ dữ liệu đọc từ file điểm thô (Đối xứng với CourseConfig) */
export interface RawGrades {
  meta: RawGradesMeta
  students: RawStudentRow[]
  attendance: AttendanceRecord[]
  attendanceSessions: AttendanceSession[]
  declaredMaxScores: Record<string, number>
  studentExcelRows?: number[]
}
