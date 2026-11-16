/**
 * Nhận diện các cột điểm danh (Buổi 1..N) trong header.
 */

import { isAttendanceHeader, isInvalidAttendanceHeader } from './helpers'
import { GradeSheetParseError } from './errors'
import type { AttendanceColumn } from './types'

export interface AttendanceColumnsResult {
  sessions: string[]
  columns: AttendanceColumn[]
}

export function parseAttendanceColumns(headers: string[]): AttendanceColumnsResult {
  const sessions: string[] = []
  const columns: AttendanceColumn[] = []

  headers.forEach((header, index) => {
    const trimmed = header.trim()
    if (!trimmed) return

    if (isAttendanceHeader(trimmed)) {
      sessions.push(trimmed)
      columns.push({ index, tenBuoi: trimmed })
    } else if (isInvalidAttendanceHeader(trimmed)) {
      throw new GradeSheetParseError(
        `Cột điểm danh "${trimmed}" không đúng định dạng. Chỉ chấp nhận 3 định dạng: "Buổi <số>" (ví dụ Buổi 1), "Buổi <số> (<ngày>/<tháng>)" (ví dụ Buổi 1 (28/10)), hoặc "<ngày>/<tháng>" (ví dụ 28/10).`
      )
    }
  })

  return { sessions, columns }
}
