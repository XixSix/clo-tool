/**
 * Data Models: PHÂN TÍCH VÀ BÁO CÁO
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * File này chỉ chứa thống kê, phân tích và dữ liệu đầu ra cho báo cáo.
 * Kết quả chi tiết của từng sinh viên nằm trong result.ts.
 */

import type { StudentCourseResult } from './result'

/** Thống kê một CLO trong toàn lớp. */
export interface CLOStatistics {
  cloId: string
  soSinhVienDat: number
  tyLeDat: number
  soSinhVienKhongDat: number
  tyLeKhongDat: number
  trungBinh: number
  thapNhat: number
  caoNhat: number
  duoiNguongCanhBao: boolean
}

/** Thống kê một PLO trong toàn lớp. */
export interface PLOStatistics {
  ploId: string
  soSinhVienDat: number
  tyLeDat: number
  soSinhVienKhongDat: number
  tyLeKhongDat: number
  trungBinh: number
}

/** Thống kê điểm học phần trong toàn lớp. */
export interface CourseStatistics {
  soSinhVienDat: number
  tyLeDat: number
  soSinhVienKhongDat: number
  tyLeKhongDat: number
  trungBinh: number
  thapNhat: number
  caoNhat: number
}

/** Tổng hợp dữ liệu phân tích toàn lớp. */
export interface ClassEvaluationSummary {
  tongSinhVien: number
  soSinhVienDuocTinh: number
  soSinhVienVangThi: number
  soSinhVienThieuDuLieu: number
  clo: CLOStatistics[]
  plo: PLOStatistics[]
  hocPhan: CourseStatistics
  canhBao: string[]
}

/** Dữ liệu đầy đủ dùng cho phân tích và xuất báo cáo học phần. */
export interface EvaluationReport {
  hocPhanId: string
  sinhVien: StudentCourseResult[]
  tongHop: ClassEvaluationSummary
}
