/**
 * Parse sheet HOC_PHAN — thông tin chung của học phần.
 */

import type ExcelJS from 'exceljs'
import type { CourseInfo } from '../../types'
import { findSheet, parseNumber } from '../../utils/excel'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'
import { ConfigParseError } from './errors'

export function parseHocPhanSheet(wb: ExcelJS.Workbook): CourseInfo {
  const ws = findSheet(wb, 'HOC_PHAN')
  if (!ws) {
    throw new ConfigParseError('Thiếu sheet HOC_PHAN trong file Config.')
  }

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.HOC_PHAN, 'HOC_PHAN')
  const r = rows[0]
  if (r === undefined) {
    throw new ConfigParseError('Sheet HOC_PHAN không có dữ liệu.')
  }

  return {
    maHp: get(ws, r, headers, 'Ma_HP'),
    tenHp: get(ws, r, headers, 'Ten_HP'),
    soTinChi: parseNumber(get(ws, r, headers, 'So_Tin_Chi')) ?? 0,
    hinhThucThi: get(ws, r, headers, 'Hinh_Thuc_Thi'),
    loaiHp: get(ws, r, headers, 'Loai_HP') === 'thuc_hanh' ? 'thuc_hanh' : 'thuong'
  }
}
