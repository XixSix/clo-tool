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
          className="text-primary text-xs font-medium hover:underline"
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
        <div className="border-border rounded-xl border border-dashed px-4 py-8 text-center">
          <Trash2 className="text-muted-foreground/40 mx-auto size-4" />
          <p className="mt-2 text-[13px] font-medium">Chưa có hoạt động nào</p>
          <p className="text-muted-foreground/70 text-xs">
            Thêm môn học hoặc tạo bộ file mẫu để thử nghiệm
          </p>
        </div>
      ) : (
        activities.map((s) => {
          const run = s.history[s.history.length - 1]
          return <ActivityRow key={s.id} session={s} ts={run.ts} onOpen={() => onOpen(s)} />
        })
      )}
    </div>
  )
}
