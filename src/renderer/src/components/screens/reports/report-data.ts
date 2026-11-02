import { formatPercent, formatScore } from '@renderer/lib/format'
import type { ChartConfig } from '@renderer/components/ui/chart'
import type { RunSnapshotDto } from '../../../../../shared/ipc'

export const histogramConfig = {
  students: { label: 'Sinh viên', color: 'var(--chart-1)' }
} satisfies ChartConfig

export const cloConfig = {
  passedPercent: { label: '% đạt', color: 'var(--chart-1)' }
} satisfies ChartConfig

export const alphaConfig = {
  alpha: { label: 'Cronbach α', color: 'var(--chart-2)' }
} satisfies ChartConfig

export interface HistogramBin {
  range: string
  students: number
}

export interface CloDatum {
  code: string
  passedPercent: number
  below: boolean
}

export interface AlphaDatum {
  name: string
  alpha: number
  low: boolean
}

/** Chia điểm học phần thành 10 khoảng [i, i+1) để vẽ histogram. */
export function buildHistogram(snapshot: RunSnapshotDto): HistogramBin[] {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i}–${i + 1}`,
    students: 0
  }))
  snapshot.students.forEach((s) => {
    const idx = Math.max(0, Math.min(9, Math.floor(s.courseScore)))
    bins[idx].students += 1
  })
  return bins
}

/** Tỷ lệ đạt từng CLO kèm cờ dưới ngưỡng cảnh báo. */
export function buildCloData(snapshot: RunSnapshotDto): CloDatum[] {
  const { summary, config } = snapshot
  return config.cloList.map((clo) => {
    const stat = summary.cloStats[clo.maClo]
    return {
      code: clo.maClo,
      passedPercent: stat?.passedPercent ?? 0,
      below: stat?.isBelowThreshold ?? false
    }
  })
}

/** Cronbach α theo từng đề; α ≤ 0.6 coi là thấp. */
export function buildAlphaData(snapshot: RunSnapshotDto): AlphaDatum[] {
  return snapshot.exams.map((exam) => ({
    name: `${exam.maDauDiem}·${exam.maDe}`,
    alpha: exam.cronbachAlpha,
    low: exam.cronbachAlpha <= 0.6
  }))
}

/** Trung vị điểm học phần. */
export function medianCourseScore(snapshot: RunSnapshotDto): number {
  const scores = snapshot.students.map((s) => s.courseScore).sort((a, b) => a - b)
  if (scores.length === 0) return 0
  const mid = Math.floor(scores.length / 2)
  return scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid]
}

/** Gợi ý xử lý trước khi nộp báo cáo: CLO dưới ngưỡng, đề kém tin cậy, vắng thi, thiếu điểm. */
export function buildAttention(snapshot: RunSnapshotDto): string[] {
  const { summary, config } = snapshot
  const items: string[] = []

  Object.values(summary.cloStats)
    .filter((stat) => stat.isBelowThreshold)
    .forEach((stat) =>
      items.push(
        `${stat.maClo} chỉ đạt ${formatPercent(stat.passedPercent)} — dưới ngưỡng cảnh báo ${config.quyTac.ty_le_dat_clo_canh_bao}%`
      )
    )

  snapshot.exams
    .filter((exam) => exam.cronbachAlpha <= 0.7)
    .forEach((exam) =>
      items.push(
        `Đề ${exam.maDe} (${exam.maDauDiem}) có α = ${formatScore(exam.cronbachAlpha)} — ${exam.mucDoTinCay}`
      )
    )

  if (summary.absentStudents > 0) {
    items.push(`${summary.absentStudents} sinh viên vắng thi cuối kỳ (tính 0 điểm theo QĐ450)`)
  }
  if (summary.missingDataStudents > 0) {
    items.push(`${summary.missingDataStudents} sinh viên thiếu dữ liệu điểm`)
  }

  return items
}
