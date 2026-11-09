/**
 * Đọc hàng "Điểm tối đa" ngay dưới header (nếu có).
 */

import type ExcelJS from 'exceljs'
import type { Course } from '../../types'
import { cellText, parseNumber } from '../../utils/excel'
import { maxScoreByColumn } from '../../utils/courseModel'
import type { DeclaredMaxScoreResult } from './types'

export function parseDeclaredMaxScores(
  ws: ExcelJS.Worksheet,
  headerRow: number,
  course: Course,
  mapping: Record<string, number>
): DeclaredMaxScoreResult {
  const scores: Record<string, number> = {}
  let firstStudentRow = headerRow + 1

  const maxByColumn = maxScoreByColumn(course)
  const maxRowTexts: string[] = []
  for (let c = 1; c <= ws.columnCount; c++) {
    maxRowTexts.push(cellText(ws.getRow(firstStudentRow).getCell(c)))
  }

  const isMaxRow =
    maxRowTexts.some((text) => /tối\s*đa|toi\s*da/i.test(text)) ||
    (maxRowTexts[0]?.trim() === '' &&
      Array.from(maxByColumn.keys()).every((maCot) => {
        const index = mapping[maCot]
        return (
          index !== undefined &&
          maxRowTexts[index] !== '' &&
          parseNumber(maxRowTexts[index]) !== null
        )
      }))

  if (!isMaxRow) return { scores, firstStudentRow }

  for (const maCot of maxByColumn.keys()) {
    const index = mapping[maCot]
    if (index === undefined) continue

    const value = parseNumber(maxRowTexts[index])
    if (value !== null) scores[maCot] = value
  }

  firstStudentRow += 1
  return { scores, firstStudentRow }
}
