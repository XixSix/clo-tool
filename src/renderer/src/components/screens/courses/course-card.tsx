import React, { useState } from 'react'
import { ChartColumn, EllipsisVertical, Settings2, Trash2, Upload, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { useWorkspace } from '@renderer/hooks/workspace'
import { formatDateTime, formatPercent, formatScore } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import type { SessionDto } from '../../../../../shared/ipc'
import { DeleteCourseDialog } from '@renderer/components/screens/courses/delete-course-dialog'

/** Thẻ một môn trong danh sách môn học. */
export function CourseCard({
  session,
  isActive,
  onOpen,
  onDetail
}: {
  session: SessionDto
  isActive: boolean
  onOpen: (session: SessionDto, screen: ScreenId) => void
  onDetail: (session: SessionDto, tab?: 'info' | 'config' | 'runs') => void
}): React.ReactElement {
  const { removeSession } = useWorkspace()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const lastRun = session.history[session.history.length - 1]

  return (
    <Card
      className={
        isActive
          ? 'ring-foreground/20 ring-2 transition hover:shadow-md'
          : 'transition hover:shadow-md'
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onDetail(session)}
            className="truncate text-left font-mono text-base font-medium hover:underline"
            title="Xem chi tiết môn học"
          >
            {session.maHp}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground -my-2 -mr-2 size-7"
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDetail(session, 'config')}>
                <Settings2 /> Cấu hình môn
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 /> Xoá môn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">{session.courseName}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {session.lop ? <Badge variant="outline">{session.lop}</Badge> : null}
          <Badge variant="secondary">{session.soTinChi} tín chỉ</Badge>
          {session.cloCount ? <Badge variant="secondary">{session.cloCount} CLO</Badge> : null}
          {isActive ? <Badge>Đang chọn</Badge> : null}
        </div>

        {lastRun ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đạt học phần</span>
              <span className="font-medium">{formatPercent(lastRun.passedPercent)}</span>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>
                {lastRun.studentCount} sinh viên · TB {formatScore(lastRun.meanCourseScore)}
              </span>
              <span>{formatDateTime(lastRun.ts)}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Chưa nhập điểm lần nào</p>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => onDetail(session, 'config')}>
          <Settings2 data-icon="inline-start" />
          Cấu hình
        </Button>
        <Button variant="outline" size="sm" onClick={() => onOpen(session, 'students')}>
          <Users data-icon="inline-start" />
          Sinh viên
        </Button>
        <Button variant="outline" size="sm" onClick={() => onOpen(session, 'reports')}>
          <ChartColumn data-icon="inline-start" />
          Báo cáo
        </Button>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => onOpen(session, 'import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </CardFooter>

      <DeleteCourseDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        session={session}
        onConfirm={() => removeSession(session.id)}
      />
    </Card>
  )
}
