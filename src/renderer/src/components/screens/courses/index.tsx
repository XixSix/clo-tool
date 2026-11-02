import React, { useState } from 'react'
import { LibraryBig, Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useOpenCourseScreen } from '@renderer/hooks/use-open-course-screen'
import type { ScreenId } from '@renderer/lib/navigation'
import { AddCourseDialog } from '@renderer/components/screens/courses/add-course-dialog'
import { CourseCard } from '@renderer/components/screens/courses/course-card'
import { CourseDetail } from '@renderer/components/screens/courses/course-detail'

export function MonHoc({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { ws, loading, active, upsertSession } = useWorkspace()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const openCourse = useOpenCourseScreen(onScreen)

  const detail = (ws?.sessions ?? []).find((s) => s.id === detailId) ?? null

  if (detail) {
    return <CourseDetail session={detail} onBack={() => setDetailId(null)} onScreen={onScreen} />
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Danh sách môn học</h2>
          <p className="text-[13px] text-muted-foreground/80">
            {ws?.sessions.length ?? 0} môn đã quản lý
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Thêm môn
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (ws?.sessions.length ?? 0) === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border">
          <EmptyHeader>
            <LibraryBig />
            <EmptyTitle>Chưa có môn học nào</EmptyTitle>
            <EmptyDescription>
              Thêm môn học đầu tiên để bắt đầu quản lý File Config, File điểm và lịch sử báo cáo.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus data-icon="inline-start" />
            Thêm môn học
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ws!.sessions.map((s) => (
            <CourseCard
              key={s.id}
              session={s}
              isActive={active?.id === s.id}
              onDetail={(session) => setDetailId(session.id)}
              onOpen={(session, screen) => openCourse(session, screen)}
            />
          ))}
        </div>
      )}

      <AddCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={upsertSession} />
    </div>
  )
}
