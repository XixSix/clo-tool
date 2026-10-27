/**
 * Nhận diện các cột điểm danh (Buổi 1..N) trong header.
 */

import type { AttendanceSession } from '../../types'
import { isAttendanceHeader } from './helpers'
import type { AttendanceColumn } from './types'

export interface AttendanceColumnsResult {
  sessions: AttendanceSession[]
  columns: AttendanceColumn[]
}

export function parseAttendanceColumns(headers: string[]): AttendanceColumnsResult {
  const sessions: AttendanceSession[] = []
  const columns: AttendanceColumn[] = []

  headers.forEach((header, index) => {
    if (!isAttendanceHeader(header)) return

    const label = header.trim()
    sessions.push({ column: label, label })
    columns.push({ index, label })
  })

  return { sessions, columns }
}
