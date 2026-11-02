import type { RunHistoryEntryDto, SessionDto } from '../../../shared/ipc'

/** Điểm số hiển thị kiểu Việt Nam (dấu phẩy thập phân, tối đa 2 chữ số) */
export function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
}

/** Phần trăm đã kèm đơn vị */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** Lần chạy gần nhất có snapshot chi tiết (bỏ qua dữ liệu cũ không có runId) */
export function latestDetailedRun(session: SessionDto | null): RunHistoryEntryDto | null {
  if (!session) return null
  for (let i = session.history.length - 1; i >= 0; i -= 1) {
    if (session.history[i].runId) return session.history[i]
  }
  return null
}
