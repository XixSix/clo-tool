/**
 * Parse sheet HOC_PHAN — thông tin chung của học phần.
 */

import type ExcelJS from 'exceljs'
import type { CourseInfo, ValidationIssue } from '../../types'
import { findSheet, parseNumber } from '../excelUtils'
import { CONFIG_SHEET_COLUMNS, get, readTable } from './helpers'

const EMPTY_COURSE: CourseInfo = {
  maHp: '',
  tenHp: '',
  soTinChi: 0,
  hinhThucThi: '',
  loaiHp: 'thuong'
}

export function parseHocPhanSheet(wb: ExcelJS.Workbook, issues: ValidationIssue[]): CourseInfo {
  const ws = findSheet(wb, 'HOC_PHAN')
  if (!ws) {
    issues.push({ level: 'error', message: 'Thiếu sheet HOC_PHAN trong file Config.' })
    return { ...EMPTY_COURSE }
  }

  const { headers, rows } = readTable(ws, CONFIG_SHEET_COLUMNS.HOC_PHAN, 'HOC_PHAN', issues)
  const r = rows[0]
  if (r === undefined) {
    issues.push({
      level: 'error',
      sheet: 'HOC_PHAN',
      message: 'Sheet HOC_PHAN không có dữ liệu.'
    })
    return { ...EMPTY_COURSE }
  }

  return {
    maHp: get(ws, r, headers, 'Ma_HP'),
    tenHp: get(ws, r, headers, 'Ten_HP'),
    soTinChi: parseNumber(get(ws, r, headers, 'So_Tin_Chi')) ?? 0,
    hinhThucThi: get(ws, r, headers, 'Hinh_Thuc_Thi'),
    loaiHp: get(ws, r, headers, 'Loai_HP') === 'thuc_hanh' ? 'thuc_hanh' : 'thuong'
  }
}
