import React, { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { ConfirmDialog } from '@renderer/components/confirm-dialog'
import { useWorkspace } from '@renderer/hooks/workspace'

/** Card "Vùng nguy hiểm": xoá toàn bộ môn học đã lưu trong máy. */
export function DangerZone(): React.ReactElement {
  const { ws, removeSession } = useWorkspace()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Vùng nguy hiểm</CardTitle>
          <CardDescription>Xoá toàn bộ dữ liệu môn học đã lưu trong máy</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 data-icon="inline-start" />
            Xoá toàn bộ môn học
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xoá toàn bộ môn học?"
        description={
          <>
            Hành động này xóa {ws?.sessions.length ?? 0} môn cùng toàn bộ lịch sử chạy. Không thể
            hoàn tác.
          </>
        }
        confirmLabel="Xoá tất cả"
        onConfirm={() => ws?.sessions.forEach((s) => removeSession(s.id))}
      />
    </>
  )
}
