/**
 * Data Models: KẾT QUẢ TÍNH ĐIỂM
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Quy ước:
 * - Type/interface dùng tiếng Anh.
 * - Field nghiệp vụ dùng tiếng Việt, camelCase.
 * - Liên kết nội bộ dùng ID.
 * - Kết quả chi tiết chỉ đi theo một chiều: sinh viên → đợt → CLO.
 */

import type { AssessmentGroup } from './course'

/** Cảnh báo hoặc lỗi phát sinh trong quá trình tính điểm. */
export interface ScoreIssue {
  mucDo: 'warning' | 'error'
  maLoi: string
  noiDung: string
  dotDanhGiaId?: string
  cauHoiId?: string
  cloId?: string
}

/** Điểm của một CLO trong một đợt đánh giá. */
export interface AssessmentCLOScore {
  cloId: string
  diem: number
  diemTho?: number
}

/** Kết quả của một đợt đánh giá: CC, GK hoặc CK. */
export interface AssessmentResult {
  dotDanhGiaId: string
  nhom: AssessmentGroup
  diem: number
  clo: AssessmentCLOScore[]
}

/** Kết quả tổng hợp một CLO trong toàn học phần. */
export interface CLOResult {
  cloId: string
  diem: number
}

/** Kết quả một PI. */
export interface PIResult {
  piId: string
  diem: number
}

/** Kết quả một PLO thành phần. */
export interface PartialPLOResult {
  ploThanhPhanId: string
  diem: number
  pi: PIResult[]
}

/** Kết quả một PLO. PLO có cấu trúc con thật nên giữ nesting. */
export interface PLOResult {
  ploId: string
  diem: number
  ploThanhPhan: PartialPLOResult[]
}

/** Kết quả toàn bộ của một sinh viên trong một học phần. */
export interface StudentCourseResult {
  id: string
  sinhVienId: string
  hocPhanId: string

  /** Chi tiết theo đúng chiều tính toán: đợt → CLO. */
  dotDanhGia: AssessmentResult[]

  /** Điểm CLO sau khi gom tất cả đợt đánh giá. */
  clo: CLOResult[]

  /** Cây kết quả PLO → PLO thành phần → PI. */
  plo: PLOResult[]

  tbcClo: number
  diemQuaTrinh?: number
  diemHocPhan: number
  diemHocPhanQd450?: number
  diemHocPhanRawPoints?: number

  datHocPhan: boolean
  vangThiCuoiKy: boolean
  thieuDuLieu: boolean
  canhBao: ScoreIssue[]
}
