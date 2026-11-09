/**
 * Nhận diện các cột điểm danh (Buổi 1..N) trong header.
 */

import type { RawAttendanceSession } from '../../types'
import { isAttendanceHeader, isInvalidAttendanceHeader } from './helpers'
import { RawGradesParseError } from './errors'
import type { AttendanceColumn } from './types'

export interface AttendanceColumnsResult {
  sessions: RawAttendanceSession[]
  columns: AttendanceColumn[]
}

export function parseAttendanceColumns(headers: string[]): AttendanceColumnsResult {
  const sessions: RawAttendanceSession[] = []
  const columns: AttendanceColumn[] = []

  headers.forEach((header, index) => {
    const trimmed = header.trim()
    if (!trimmed) return

    if (isAttendanceHeader(trimmed)) {
      sessions.push({ column: trimmed, label: trimmed })
      columns.push({ index, label: trimmed })
    } else if (isInvalidAttendanceHeader(trimmed)) {
      throw new RawGradesParseError(
        `Cột điểm danh "${trimmed}" không đúng định dạng. Chỉ chấp nhận 3 định dạng: "Buổi <số>" (ví dụ Buổi 1), "Buổi <số> (<ngày>/<tháng>)" (ví dụ Buổi 1 (28/10)), hoặc "<ngày>/<tháng>" (ví dụ 28/10).`
      )
    }
  })

  return { sessions, columns }
}
