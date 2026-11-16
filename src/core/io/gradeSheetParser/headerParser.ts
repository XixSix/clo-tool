/**
 * Dò header bảng điểm thô và kiểm tra các cột điểm khai báo trong Course.
 *
 * `requireMaDe`: bắt buộc cột Mã đề (dùng cho giai đoạn cuối kỳ khi có nhiều mã đề).
 */

import type ExcelJS from 'exceljs'
import type { Course } from '../../types'
import { readTable } from '../../utils/excel'
import { GradeSheetParseError } from './errors'
import { BASE_COLUMNS, scoreColumnsFromConfig } from './helpers'
import type { GradeSheetHeaderInfo } from './types'

export interface GradeSheetHeaderResult {
  header: GradeSheetHeaderInfo
  scoreColumns: string[]
}

export interface ParseGradeSheetHeaderOptions {
  requireMaDe?: boolean
}

export function parseGradeSheetHeader(
  ws: ExcelJS.Worksheet,
  course: Course,
  options: ParseGradeSheetHeaderOptions = {}
): GradeSheetHeaderResult | null {
  const scoreColumns = scoreColumnsFromConfig(course)
  const columns = [...BASE_COLUMNS, ...scoreColumns]
  if (options.requireMaDe) columns.push('Ma_De')

  const table = readTable(ws, columns, ws.name, {
    maxScanRows: 30,
    makeError: (message) => new GradeSheetParseError(message),
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

/** Cột điểm có trong Course nhưng không dò được trong file. */
export function assertScoreColumns(header: GradeSheetHeaderInfo, scoreColumns: string[]): void {
  for (const maCot of scoreColumns) {
    if (header.mapping[maCot] !== undefined) continue

    const suggestion = header.suggestions[maCot]
    const hint = suggestion ? ` Có phải bạn muốn đặt tên là "${suggestion}"?` : ''
    throw new GradeSheetParseError(
      `Thiếu cột điểm "${maCot}" khai báo trong cấu hình học phần.${hint}`
    )
  }
}
