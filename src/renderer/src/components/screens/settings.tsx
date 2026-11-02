import React, { useState } from 'react'
import { Moon, Sun, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@renderer/components/ui/field'
import { ConfirmDialog } from '@renderer/components/confirm-dialog'
import { useTheme } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/hooks/workspace'

export function CaiDat(): React.ReactElement {
  const { theme, setTheme } = useTheme()
  const { ws, removeSession } = useWorkspace()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const optionRef = (next: 'light' | 'dark') => () => setTheme(next)

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Giao diện</CardTitle>
          <CardDescription>Chọn chế độ sáng hoặc tối</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="theme-choice">Chủ đề</FieldLabel>
              <div id="theme-choice" className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={optionRef('light')}
                >
                  <Sun data-icon="inline-start" />
                  Sáng
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={optionRef('dark')}
                >
                  <Moon data-icon="inline-start" />
                  Tối
                </Button>
              </div>
              <FieldDescription>Chủ đề được ghi nhớ giữa các lần mở app.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Về phần mềm</CardTitle>
          <CardDescription>
            Đo lường &amp; đánh giá chuẩn đầu ra học phần theo QĐ 450/QĐ-ĐHTĐ (07/8/2024)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Badge variant="secondary">Offline 100%</Badge>
          <Badge variant="secondary">v1.0.0</Badge>
          <Badge variant="secondary">Đại học Thành Đông</Badge>
        </CardContent>
      </Card>

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
    </div>
  )
}
