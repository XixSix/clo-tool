/**
 * Đọc file Config học phần (.xlsx) → CourseConfig.
 *
 * Mỗi sheet một module parser riêng (giây bộ validator):
 * - hocPhanParser, cloListParser, keHoachParser, cauHoiParser,
 *   maTranPloParser, diemDanhParser, quyTacParser
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
import { parseDiemDanhSheet } from './diemDanhParser'
import { parseQuyTacSheet } from './quyTacParser'

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
    diemDanh: parseDiemDanhSheet(wb),
    quyTac: parseQuyTacSheet(wb)
  }

  return config
}
