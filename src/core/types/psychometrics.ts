/**
 * Data Models: KIỂM ĐỊNH ĐỀ THI (PSYCHOMETRICS)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Lưu ý: File này độc lập 100%, không import bất kỳ package nào từ Electron hoặc React.
 */

export type DifficultyLevel = 'Rất khó' | 'Khó' | 'Tương đối khó' | 'Trung bình' | 'Dễ'
export type DiscriminationLevel = 'Nên loại bỏ' | 'Yếu' | 'Đủ độ phân biệt' | 'Tốt' | 'Rất tốt'
export type ReliabilityLevel = 'Không đủ độ tin cậy' | 'Yếu' | 'Đủ độ tin cậy' | 'Cao' | 'Rất cao'

export interface ItemPsychometrics {
  cau: string
  diemToiDa: number
  diemTrungBinh: number
  doKhoP: number
  mucDoKho: DifficultyLevel
  doPhanBietD: number
  mucDoPhanBiet: DiscriminationLevel
  alphaNeuBoCau: number
  canhBao?: string // e.g. "d < 0: Nên loại bỏ câu này" hoặc "p < 0.2: Câu rất khó"
}

export interface ExamPsychometrics {
  maDauDiem: string
  maDe: string
  soSinhVien: number
  soCauHoi: number
  items: ItemPsychometrics[]
  cronbachAlpha: number
  mucDoTinCay: ReliabilityLevel
  tongPhuongSaiCau: number
  phuongSaiTongDiem: number
  canhBaoCoMauN?: string // In cảnh báo khi N < 30 hoặc nhóm 27% < 5 SV
}
