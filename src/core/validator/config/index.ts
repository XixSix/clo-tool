/**
 * Tổng hợp validator cho file Config (tách module theo từng sheet — đặc tả mục V).
 *
 * Phân biệt:
 * - Lỗi (error): không cho tính tiếp.
 * - Cảnh báo (warning): vẫn tính, ghi vào sheet CANH_BAO.
 *
 * Mỗi sheet có một file validator riêng; các check chéo nằm ở crossSheetValidator.
 */

import type { CourseConfig, ValidationIssue } from '../../types'
import { validateHocPhan } from './hocPhanValidator'
import { validateCloList } from './cloListValidator'
import { validateKeHoach } from './keHoachValidator'
import { validateCauHoi } from './cauHoiValidator'
import { validateMaTranPlo } from './maTranPloValidator'
import { validateDiemDanh } from './diemDanhValidator'
import { validateQuyTac } from './quyTacValidator'
import { validateCrossSheet } from './crossSheetValidator'

export function validateConfig(config: CourseConfig): ValidationIssue[] {
  return [
    ...validateHocPhan(config),
    ...validateCloList(config),
    ...validateKeHoach(config),
    ...validateCauHoi(config),
    ...validateMaTranPlo(config),
    ...validateDiemDanh(config),
    ...validateQuyTac(config),
    ...validateCrossSheet(config)
  ]
}
