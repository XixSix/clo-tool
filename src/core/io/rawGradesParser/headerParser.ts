/**
 * Dò header bảng điểm thô và kiểm tra các cột điểm khai báo trong Config.
 *
 * File điểm thô dùng chung `readTable` với Config: header cố định một hàng,
 * thiếu cột bắt buộc thì dừng ngay — không hỗ trợ layout lộn xộn.
 *
 * `Ma_De` là cột tùy chọn (file một đề không cần); khi cuối kỳ có nhiều mã đề,
 * parser truyền `requireMaDe` để bắt buộc cột này.
 */

import type ExcelJS from 'exceljs'
import type { CourseConfig } from '../../types'
import { readTable } from '../../utils/excel'
import { RawGradesParseError } from './errors'
import { RAW_GRADES_COLUMNS, scoreColumnsFromConfig } from './helpers'
import type { RawHeaderInfo } from './types'

export interface RawHeaderResult {
  header: RawHeaderInfo
  scoreColumns: string[]
}

export interface ParseRawGradesHeaderOptions {
  requireMaDe?: boolean
}

export function parseRawGradesHeader(
  ws: ExcelJS.Worksheet,
  config: CourseConfig,
  options: ParseRawGradesHeaderOptions = {}
): RawHeaderResult {
  const scoreColumns = scoreColumnsFromConfig(config)
  const columns = [...RAW_GRADES_COLUMNS, ...scoreColumns]
  if (options.requireMaDe) columns.push('Ma_De')

  const table = readTable(ws, columns, ws.name, {
    maxScanRows: 30,
    makeError: (message) => new RawGradesParseError(message),
    optionalColumns: options.requireMaDe ? [] : ['Ma_De']
  })

  return {
    scoreColumns,
    header: {
      rowNumber: table.rowNumber,
      headers: table.headerTexts,
      mapping: table.mapping,
      suggestions: table.suggestions
    }
  }
}
