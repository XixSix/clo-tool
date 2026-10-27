/**
 * Đọc file Config học phần (.xlsx) → CourseConfig.
 *
 * Mỗi sheet một module parser riêng (giây bộ validator):
 * - hocPhanParser, cloListParser, keHoachParser, cauHoiParser, maTranPloParser
 *
 * Orchestrator chỉ mở workbook, gọi tuần tự từng parser và ghép kết quả.
 */

import type { CourseConfig } from '../../types'
import { readWorkbook } from '../../utils/excel'
import { parseHocPhanSheet } from './hocPhanParser'
import { parseCloListSheet } from './cloListParser'
import { parseKeHoachSheet } from './keHoachParser'
import { parseCauHoiSheet } from './cauHoiParser'
import { parseMaTranPloSheet } from './maTranPloParser'
import { DEFAULT_ATTENDANCE_RULES, DEFAULT_BUSINESS_RULES } from '../../rules'

export * from './helpers'
export * from './errors'

export async function parseCourseConfig(filePath: string): Promise<CourseConfig> {
  const wb = await readWorkbook(filePath)
  const config: CourseConfig = {
    courseInfo: parseHocPhanSheet(wb),
    cloList: parseCloListSheet(wb),
    keHoachDanhGia: parseKeHoachSheet(wb),
    cauHoi: parseCauHoiSheet(wb),
    maTranPlo: parseMaTranPloSheet(wb),
    // Cấu hình điểm danh và quy tắc dùng mặc định; sau này lấy từ Settings.
    diemDanh: DEFAULT_ATTENDANCE_RULES.map((rule) => ({ ...rule })),
    quyTac: { ...DEFAULT_BUSINESS_RULES }
  }

  return config
}
