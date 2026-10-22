/**
 * Data Models: DỮ LIỆU ĐIỂM THÔ SINH VIÊN (RAW INPUT)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Lưu ý: File này độc lập 100%, không import bất kỳ package nào từ Electron hoặc React.
 */

export interface RawStudentRow {
  tt: number
  maSv: string
  hoTen: string
  ngaySinh?: string
  maDe?: string
  diemCacCot: Record<string, number | 'VT' | null | undefined>
  ghiChu?: string
}
