import React from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@renderer/components/confirm-dialog'
import type { SessionDto } from '../../../../../shared/ipc'

/** Hộp thoại xác nhận xoá một môn học cùng toàn bộ lịch sử chạy của môn đó. */
export function DeleteCourseDialog({
  open,
  onOpenChange,
  session,
  onConfirm
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  session: SessionDto
  onConfirm: () => void
}): React.ReactElement {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xoá môn học?"
      description={
        <>
          Môn <span className="font-mono font-medium">{session.maHp}</span> — {session.courseName}{' '}
          cùng {session.history.length} lần chạy sẽ bị xoá khỏi máy. Không thể hoàn tác.
        </>
      }
      confirmLabel="Xoá môn"
      icon={<Trash2 data-icon="inline-start" />}
      onConfirm={onConfirm}
    />
  )
}
