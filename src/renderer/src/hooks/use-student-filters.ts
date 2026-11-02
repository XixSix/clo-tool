import { useMemo, useState } from 'react'
import { normalizeText } from '@renderer/lib/text'
import type { RunSnapshotDto } from '../../../shared/ipc'
import type { ProcessedStudentResult } from '@core/types'

export type FilterId = 'all' | 'pass' | 'fail' | 'absent' | 'missing' | 'warning'

export const FILTER_LABELS: Record<FilterId, string> = {
  all: 'Tất cả',
  pass: 'Đạt',
  fail: 'Không đạt',
  absent: 'Vắng thi',
  missing: 'Thiếu điểm',
  warning: 'Cảnh báo'
}

export interface StudentRow {
  student: ProcessedStudentResult
  passedClos: number
  totalClos: number
}

export interface StudentFilters {
  filter: FilterId
  setFilter: (id: FilterId) => void
  query: string
  setQuery: (q: string) => void
  threshold: number
  rows: StudentRow[]
  counts: Record<FilterId, number>
  visible: StudentRow[]
}

/** Lọc + đếm sinh viên theo bộ lọc trạng thái và ô tìm kiếm. */
export function useStudentFilters(snapshot: RunSnapshotDto | null): StudentFilters {
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const threshold = snapshot?.config.quyTac.nguong_dat_clo ?? 4

  const rows = useMemo<StudentRow[]>(() => {
    if (!snapshot) return []
    return snapshot.students.map((student) => {
      const cloCodes = Object.keys(student.cloScores)
      const passedClos = cloCodes.filter(
        (code) => (student.cloScores[code] ?? 0) >= threshold
      ).length
      return { student, passedClos, totalClos: cloCodes.length }
    })
  }, [snapshot, threshold])

  const counts = useMemo<Record<FilterId, number>>(() => {
    const base: Record<FilterId, number> = {
      all: rows.length,
      pass: 0,
      fail: 0,
      absent: 0,
      missing: 0,
      warning: 0
    }
    rows.forEach(({ student }) => {
      if (student.isPassedHp) base.pass += 1
      else base.fail += 1
      if (student.isAbsentFinal) base.absent += 1
      if (student.hasMissingData) base.missing += 1
      if (student.issues.length > 0) base.warning += 1
    })
    return base
  }, [rows])

  const visible = useMemo<StudentRow[]>(() => {
    const q = normalizeText(query.trim())
    return rows.filter(({ student }) => {
      if (filter === 'pass' && !student.isPassedHp) return false
      if (filter === 'fail' && student.isPassedHp) return false
      if (filter === 'absent' && !student.isAbsentFinal) return false
      if (filter === 'missing' && !student.hasMissingData) return false
      if (filter === 'warning' && student.issues.length === 0) return false
      if (!q) return true
      return normalizeText(student.hoTen).includes(q) || normalizeText(student.maSv).includes(q)
    })
  }, [rows, filter, query])

  return { filter, setFilter, query, setQuery, threshold, rows, counts, visible }
}
