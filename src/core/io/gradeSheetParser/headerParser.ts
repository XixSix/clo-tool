/**
 * Dò header bảng điểm thô và kiểm tra các cột điểm khai báo trong Course.
 */

import type ExcelJS from 'exceljs'
import type { Course } from '../../types'
import { findHeaderRow } from '../../utils/excel'
import { GradeSheetParseError } from './errors'
import { BASE_COLUMNS, scoreColumnsFromConfig } from './helpers'
import type { GradeSheetHeaderInfo } from './types'

export interface GradeSheetHeaderResult {
  header: GradeSheetHeaderInfo
  scoreColumns: string[]
}

export function parseGradeSheetHeader(
  ws: ExcelJS.Worksheet,
  course: Course
): GradeSheetHeaderResult | null {
  const scoreColumns = scoreColumnsFromConfig(course)
  const found = findHeaderRow(ws, [...BASE_COLUMNS, ...scoreColumns], 30)
  if (!found) return null

  return {
    scoreColumns,
    header: {
      rowNumber: found.rowNumber,
      headers: found.headers,
      mapping: found.match.mapping,
      suggestions: found.match.suggestions
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
