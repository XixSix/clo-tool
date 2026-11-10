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
import { validateCrossSheet } from './crossSheetValidator'

export function validateConfig(config: CourseConfig): ValidationIssue[] {
  return [
    ...validateHocPhan(config.courseInfo),
    ...validateCloList(config.cloList, config.courseInfo.loaiHp),
    ...validateKeHoach(
      config.keHoachDanhGia,
      config.cloList,
      config.quyTac.canh_bao_cc_don_le
    ),
    ...validateCauHoi(config.cauHoi, config.maTranPlo),
    ...validateMaTranPlo(config.maTranPlo),
    ...validateCrossSheet(
      config.cloList,
      config.keHoachDanhGia,
      config.cauHoi,
      config.maTranPlo
    )
  ]
}
