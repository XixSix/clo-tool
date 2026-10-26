/**
 * Đọc file Config học phần (.xlsx) → CourseConfig.
 *
 * Mỗi sheet một module parser riêng (giây bộ validator):
 * - hocPhanParser, cloListParser, keHoachParser, cauHoiParser,
 *   maTranPloParser, diemDanhParser, quyTacParser
 *
 * Orchestrator chỉ mở workbook, gọi tuần tự từng parser và ghép kết quả.
 */

import type { ConfigParseResult, CourseConfig, ValidationIssue } from '../../types'
import { readWorkbook } from '../excelUtils'
import { parseHocPhanSheet } from './hocPhanParser'
import { parseCloListSheet } from './cloListParser'
import { parseKeHoachSheet } from './keHoachParser'
import { parseCauHoiSheet } from './cauHoiParser'
import { parseMaTranPloSheet } from './maTranPloParser'
import { parseDiemDanhSheet } from './diemDanhParser'
import { parseQuyTacSheet } from './quyTacParser'

export * from './helpers'

export async function parseCourseConfig(filePath: string): Promise<ConfigParseResult> {
  const wb = await readWorkbook(filePath)
  const issues: ValidationIssue[] = []

  const config: CourseConfig = {
    courseInfo: parseHocPhanSheet(wb, issues),
    cloList: parseCloListSheet(wb, issues),
    keHoachDanhGia: parseKeHoachSheet(wb, issues),
    cauHoi: parseCauHoiSheet(wb, issues),
    maTranPlo: parseMaTranPloSheet(wb, issues),
    diemDanh: parseDiemDanhSheet(wb, issues),
    quyTac: parseQuyTacSheet(wb, issues)
  }

  return {
    config,
    issues,
    hasErrors: issues.some((i) => i.level === 'error')
  }
}
