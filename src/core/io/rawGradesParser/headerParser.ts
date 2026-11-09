/**
 * Dò header bảng điểm thô và kiểm tra các cột điểm khai báo trong Course.
 */

import type ExcelJS from 'exceljs'
import type { Course } from '../../types'
import { findHeaderRow } from '../../utils/excel'
import { RawGradesParseError } from './errors'
import { BASE_COLUMNS, scoreColumnsFromConfig } from './helpers'
import type { RawHeaderInfo } from './types'

export interface RawHeaderResult {
  header: RawHeaderInfo
  scoreColumns: string[]
}

export function parseRawGradesHeader(
  ws: ExcelJS.Worksheet,
  course: Course
): RawHeaderResult | null {
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
export function assertScoreColumns(header: RawHeaderInfo, scoreColumns: string[]): void {
  for (const maCot of scoreColumns) {
    if (header.mapping[maCot] !== undefined) continue

    const suggestion = header.suggestions[maCot]
    const hint = suggestion ? ` Có phải bạn muốn đặt tên là "${suggestion}"?` : ''
    throw new RawGradesParseError(
      `Thiếu cột điểm "${maCot}" khai báo trong cấu hình học phần.${hint}`
    )
  }
}
