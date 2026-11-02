import React from 'react'
import { Trash2 } from 'lucide-react'
import { Skeleton } from '@renderer/components/ui/skeleton'
import type { SessionDto } from '../../../../../shared/ipc'
import { ActivityRow } from '@renderer/components/screens/home/widgets'

/** Danh sách "Hoạt động gần đây" ở cuối trang chủ. */
export function RecentActivity({
  activities,
  loading,
  onOpen,
  onViewAll
}: {
  activities: SessionDto[]
  loading: boolean
  onOpen: (session: SessionDto) => void
  onViewAll: () => void
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Hoạt động gần đây</p>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-medium text-primary hover:underline"
        >
          Xem tất cả
        </button>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <Trash2 className="mx-auto size-4 text-muted-foreground/40" />
          <p className="mt-2 text-[13px] font-medium">Chưa có hoạt động nào</p>
          <p className="text-xs text-muted-foreground/70">
            Thêm môn học hoặc tạo bộ file mẫu để thử nghiệm
          </p>
        </div>
      ) : (
        activities.map((s) => {
          const run = s.history[s.history.length - 1]
          return (
            <ActivityRow key={s.id} session={s} ts={run.ts} onOpen={() => onOpen(s)} />
          )
        })
      )}
    </div>
  )
}
