import { useEffect, useState } from 'react'
import type { RunSnapshotDto } from '../../../shared/ipc'

interface RunSnapshotState {
  snapshot: RunSnapshotDto | null
  loading: boolean
  error: string
}

interface InternalState {
  runId: string | undefined
  snapshot: RunSnapshotDto | null
  error: string
  settled: boolean
}

/**
 * Tải snapshot chi tiết của một lần chạy từ main process.
 * `runId` rỗng (dữ liệu cũ) → trả null ngay, không gọi IPC.
 */
export function useRunSnapshot(runId: string | undefined): RunSnapshotState {
  const [state, setState] = useState<InternalState>({
    runId,
    snapshot: null,
    error: '',
    settled: !runId
  })

  useEffect(() => {
    if (!runId) return
    let alive = true
    const target = runId

    window.api
      .getRunSnapshot(target)
      .then((data) => {
        if (alive) setState({ runId: target, snapshot: data, error: '', settled: true })
      })
      .catch((err: unknown) => {
        if (alive) {
          setState({
            runId: target,
            snapshot: null,
            error: err instanceof Error ? err.message : 'Không tải được kết quả.',
            settled: true
          })
        }
      })

    return () => {
      alive = false
    }
  }, [runId])

  // Derive trạng thái theo runId hiện tại — không setState đồng bộ trong effect
  const loading = Boolean(runId) && (state.runId !== runId || !state.settled)
  const snapshot = state.runId === runId ? state.snapshot : null
  const error = state.runId === runId ? state.error : ''

  return { snapshot, loading, error }
}
