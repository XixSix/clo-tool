import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { RunHistoryEntryDto, SessionDto, WorkspaceDto } from '../../../shared/ipc'

interface WorkspaceContextValue {
  ws: WorkspaceDto | null
  loading: boolean
  /** Session đang chọn trong sidebar — null nếu chưa có */
  active: SessionDto | null
  setActiveSession: (id: string | null) => void
  upsertSession: (session: SessionDto) => void
  /** Cập nhật một phần thông tin môn (không đụng tới history) */
  patchSession: (id: string, patch: Partial<SessionDto>) => void
  removeSession: (id: string) => void
  /** Lưu 1 lần chạy vào history của môn (nếu có môn active) */
  archiveRun: (entry: RunHistoryEntryDto) => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

const EMPTY_WS: WorkspaceDto = { activeId: null, sessions: [] }

/** Provider lưu workspace (danh sách môn + lịch sử chạy) qua IPC tại userData */
export function WorkspaceProvider({
  children
}: {
  children: React.ReactNode
}): React.ReactElement {
  const [ws, setWs] = useState<WorkspaceDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    window.api
      .loadWorkspace()
      .then((w) => {
        if (alive) setWs(w)
      })
      .catch(() => {
        if (alive) setWs(EMPTY_WS)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  /** Cập nhật state + ghi đĩa qua IPC */
  const mutate = useCallback((next: WorkspaceDto): void => {
    setWs(next)
    window.api.saveWorkspace(next).catch((err: unknown) => {
      console.error('Không lưu được workspace:', err)
    })
  }, [])

  const setActiveSession = useCallback(
    (id: string | null): void => {
      setWs((prev) => {
        if (!prev || prev.activeId === id) return prev
        if (id) {
          // Cập nhật lastOpenedAt để xếp môn hiện tại
          const next: WorkspaceDto = {
            ...prev,
            activeId: id,
            sessions: prev.sessions.map((s) =>
              s.id === id ? { ...s, lastOpenedAt: Date.now() } : s
            )
          }
          mutate(next)
          return next
        }
        const next: WorkspaceDto = { ...prev, activeId: null }
        mutate(next)
        return next
      })
    },
    [mutate]
  )

  const upsertSession = useCallback(
    (session: SessionDto): void => {
      setWs((prev) => {
        const prevWs = prev ?? EMPTY_WS
        const exists = prevWs.sessions.some((s) => s.id === session.id)
        const next: WorkspaceDto = {
          activeId: prevWs.activeId ?? session.id,
          sessions: exists
            ? prevWs.sessions.map((s) => (s.id === session.id ? session : s))
            : [...prevWs.sessions, session]
        }
        mutate(next)
        return next
      })
    },
    [mutate]
  )

  const patchSession = useCallback(
    (id: string, patch: Partial<SessionDto>): void => {
      setWs((prev) => {
        if (!prev) return prev
        const next: WorkspaceDto = {
          ...prev,
          sessions: prev.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s))
        }
        mutate(next)
        return next
      })
    },
    [mutate]
  )

  const removeSession = useCallback(
    (id: string): void => {
      setWs((prev) => {
        if (!prev) return prev
        // Xoá snapshot chi tiết của các lần chạy thuộc môn bị xoá
        const removed = prev.sessions.find((s) => s.id === id)
        removed?.history.forEach((run) => {
          if (run.runId) void window.api.deleteRunSnapshot(run.runId)
        })
        const next: WorkspaceDto = {
          activeId: prev.activeId === id ? null : prev.activeId,
          sessions: prev.sessions.filter((s) => s.id !== id)
        }
        mutate(next)
        return next
      })
    },
    [mutate]
  )

  const archiveRun = useCallback(
    (entry: RunHistoryEntryDto): void => {
      setWs((prev) => {
        const targetId = prev?.activeId ?? prev?.sessions[0]?.id
        if (!prev || !targetId) return prev
        const next: WorkspaceDto = {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === targetId
              ? {
                  ...s,
                  // Chỉ giữ 20 lần chạy gần nhất để workspace gọn
                  history: [...s.history, entry].slice(-20)
                }
              : s
          )
        }
        mutate(next)
        return next
      })
    },
    [mutate]
  )

  const active: SessionDto | null =
    ws?.sessions.find((s) => s.id === ws.activeId) ?? ws?.sessions[0] ?? null

  return (
    <WorkspaceContext.Provider
      value={{ ws, loading, active, setActiveSession, upsertSession, patchSession, removeSession, archiveRun }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace phải nằm trong <WorkspaceProvider>')
  return ctx
}

/** Sinh id môn mới — nano chuẩn hoá không cần thư viện ngoài */
export function newSessionId(): string {
  return `mon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
