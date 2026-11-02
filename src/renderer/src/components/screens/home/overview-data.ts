import { formatPercent, formatScore } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import type { SessionDto } from '../../../../../shared/ipc'

export interface AttentionItem {
  id: string
  title: string
  hint: string
  level: 'warning' | 'muted'
  screen: ScreenId
}

export interface PassByCourseItem {
  id: string
  code: string
  pass: number
  low: boolean
}

export interface HomeOverview {
  /** 5 môn có lần chạy gần nhất, mới nhất trước */
  activities: SessionDto[]
  totalStudents: number
  totalRuns: number
  avgPass: number
  passByCourse: PassByCourseItem[]
  /** Môn chưa nhập điểm hoặc tỷ lệ đạt dưới 50% */
  attention: AttentionItem[]
}

/** Tổng hợp số liệu trang chủ từ danh sách môn — tách khỏi component để dễ đọc và test. */
export function buildHomeOverview(sessions: SessionDto[]): HomeOverview {
  const activities = sessions
    .filter((s) => s.history.length > 0)
    .sort((a, b) => {
      const ta = a.history[a.history.length - 1].ts
      const tb = b.history[b.history.length - 1].ts
      return tb - ta
    })
    .slice(0, 5)

  const runs = sessions.map((s) => s.history[s.history.length - 1]).filter(Boolean)
  const totalStudents = runs.reduce((sum, run) => sum + run.studentCount, 0)
  const totalRuns = sessions.reduce((sum, s) => sum + s.history.length, 0)
  const avgPass =
    runs.length > 0 ? runs.reduce((sum, run) => sum + run.passedPercent, 0) / runs.length : 0

  // Biểu đồ: tỷ lệ đạt của lần chạy gần nhất theo từng môn
  const passByCourse: PassByCourseItem[] = sessions
    .map((s) => {
      const run = s.history[s.history.length - 1]
      return run
        ? { id: s.id, code: s.maHp, pass: run.passedPercent, low: run.passedPercent < 50 }
        : null
    })
    .filter((item): item is PassByCourseItem => !!item)
    .sort((a, b) => a.pass - b.pass)

  // Danh sách cần chú ý: môn chưa nhập điểm hoặc tỷ lệ đạt dưới 50%
  const attention: AttentionItem[] = sessions
    .flatMap((s): AttentionItem[] => {
      const run = s.history[s.history.length - 1]
      if (!run) {
        return [
          {
            id: s.id,
            title: `${s.maHp} chưa nhập điểm`,
            hint: 'Chạy Nhập điểm để có dữ liệu đánh giá',
            level: 'muted',
            screen: 'import'
          }
        ]
      }
      if (run.passedPercent < 50) {
        return [
          {
            id: s.id,
            title: `${s.maHp} chỉ đạt ${formatPercent(run.passedPercent)}`,
            hint: `${run.studentCount} SV · điểm TB ${formatScore(run.meanCourseScore)}`,
            level: 'warning',
            screen: 'reports'
          }
        ]
      }
      return []
    })
    .slice(0, 5)

  return { activities, totalStudents, totalRuns, avgPass, passByCourse, attention }
}
