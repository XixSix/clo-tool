/**
 * Đọc phần thông tin lớp nằm phía trên bảng điểm.
 */

import type ExcelJS from 'exceljs'
import type { RawGradesMeta } from '../../types'
import { cellText, normalizeHeader } from '../../utils/excel'
import { META_LABELS } from './helpers'

export function parseRawGradesMeta(
  ws: ExcelJS.Worksheet,
  headerRow: number
): RawGradesMeta {
  const meta: RawGradesMeta = {}

  for (let r = 1; r < headerRow; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const label = normalizeHeader(cellText(ws.getRow(r).getCell(c)))
      if (!label) continue

      const target = META_LABELS.find((m) => m.patterns.includes(label))
      if (!target) continue

      // Giá trị nằm bên phải nhãn (bỏ qua ô trống)
      for (let cc = c + 1; cc <= Math.min(ws.columnCount, c + 4); cc++) {
        const value = cellText(ws.getRow(r).getCell(cc)).trim()
        if (value) {
          if (!meta[target.key]) meta[target.key] = value
          break
        }
      }
    }
  }

  return meta
}
