import React, { useEffect, useState } from 'react'
import { CircleCheck, RefreshCw, TriangleAlert } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import type { UpdateStatusDto } from '../../../../../shared/ipc'

/** Mô tả trạng thái cập nhật dưới dạng câu tiếng Việt + tông màu. */
function describe(status: UpdateStatusDto): { text: string; tone: string } {
  switch (status.state) {
    case 'checking':
      return { text: 'Đang kiểm tra bản cập nhật…', tone: 'text-muted-foreground' }
    case 'available':
      return {
        text: `Đã tìm thấy bản ${status.version ?? 'mới'}, đang tải về…`,
        tone: 'text-muted-foreground'
      }
    case 'downloading':
      return {
        text: `Đang tải bản ${status.version ?? 'mới'}… ${status.percent ?? 0}%`,
        tone: 'text-muted-foreground'
      }
    case 'downloaded':
      return { text: `Đã tải xong bản ${status.version ?? 'mới'}.`, tone: 'text-success' }
    case 'latest':
      return { text: 'Bạn đang dùng bản mới nhất.', tone: 'text-success' }
    case 'error':
      return { text: status.message ?? 'Không kiểm tra được cập nhật.', tone: 'text-destructive' }
  }
}

/** Card "Cập nhật phần mềm": kiểm tra bản mới và khởi động lại để cài. */
export function UpdateCard({ version }: { version: string }): React.ReactElement {
  const [status, setStatus] = useState<UpdateStatusDto | null>(null)

  useEffect(() => window.api.onUpdateStatus(setStatus), [])

  const busy = status?.state === 'checking' || status?.state === 'downloading'
  const info = status ? describe(status) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cập nhật phần mềm</CardTitle>
        <CardDescription>
          Phiên bản hiện tại: {version ? `v${version}` : '—'} · tự cập nhật chỉ áp dụng cho bản cài
          (setup.exe)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void window.api.checkForUpdates()}
            disabled={busy}
          >
            <RefreshCw data-icon="inline-start" className={busy ? 'animate-spin' : undefined} />
            Kiểm tra cập nhật
          </Button>
          {status?.state === 'downloaded' ? (
            <Button size="sm" onClick={() => void window.api.installUpdate()}>
              Khởi động lại để cập nhật
            </Button>
          ) : null}
        </div>
        {info ? (
          <p className={`flex items-center gap-1.5 text-xs ${info.tone}`}>
            {status?.state === 'latest' || status?.state === 'downloaded' ? (
              <CircleCheck className="size-3.5 shrink-0" />
            ) : null}
            {status?.state === 'error' ? <TriangleAlert className="size-3.5 shrink-0" /> : null}
            {info.text}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Bản portable không tự cập nhật — tải lại file mới từ trang Releases khi cần.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
