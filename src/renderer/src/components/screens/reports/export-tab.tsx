import React, { useState } from 'react'
import { Download, FileSpreadsheet, FolderOpen, Loader2, Printer } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { formatDateTime } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import type { RunHistoryEntryDto, RunSnapshotDto, SessionDto } from '../../../../../shared/ipc'

export function ExportTab({
  run,
  snapshot,
  session,
  onScreen
}: {
  run: RunHistoryEntryDto
  snapshot: RunSnapshotDto
  session: SessionDto
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  const [pdf, setPdf] = useState<{ busy: boolean; path?: string; error?: string }>({ busy: false })

  async function exportPdf(): Promise<void> {
    setPdf({ busy: true })
    try {
      const date = new Date().toISOString().slice(0, 10)
      const name = `bao-cao_${session.maHp}${session.lop ? `_${session.lop}` : ''}_${date}`
      const result = await window.api.exportPdf(name)
      if (result.ok && result.path) {
        setPdf({ busy: false, path: result.path })
      } else if (result.canceled) {
        setPdf({ busy: false })
      } else {
        setPdf({ busy: false, error: result.error ?? 'Không xuất được PDF.' })
      }
    } catch (err) {
      setPdf({
        busy: false,
        error: err instanceof Error ? err.message : 'Không xuất được PDF.'
      })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Báo cáo Excel</CardTitle>
          <CardDescription>Hai file chuẩn QĐ450 đã sinh ở lần chạy này</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium">Bảng điểm CLO/PLO</p>
              <p className="truncate text-xs text-muted-foreground">
                {run.finalReportPath?.split(/[\\/]/).pop() ?? 'Chưa có file'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!run.finalReportPath}
              onClick={() => run.finalReportPath && window.api.openPath(run.finalReportPath)}
            >
              <FileSpreadsheet data-icon="inline-start" />
              Mở
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium">Phân tích đề thi</p>
              <p className="truncate text-xs text-muted-foreground">
                {run.examReportPath?.split(/[\\/]/).pop() ?? 'Chưa có file'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!run.examReportPath}
              onClick={() => run.examReportPath && window.api.openPath(run.examReportPath)}
            >
              <FileSpreadsheet data-icon="inline-start" />
              Mở
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.api.openPath(run.outputDir)}>
            <FolderOpen data-icon="inline-start" />
            Mở thư mục báo cáo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dữ liệu &amp; bản in</CardTitle>
          <CardDescription>Xuất danh sách sinh viên hoặc bản in báo cáo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => onScreen('students')}>
            <Download data-icon="inline-start" />
            Mở màn Sinh viên để xuất CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={pdf.busy}>
            {pdf.busy ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Printer data-icon="inline-start" />
            )}
            {pdf.busy ? 'Đang tạo PDF…' : 'In báo cáo / PDF'}
          </Button>
          {pdf.path ? (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
              <span className="min-w-0 flex-1 truncate" title={pdf.path}>
                Đã lưu: {pdf.path}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-success"
                onClick={() => window.api.openPath(pdf.path!)}
              >
                Mở
              </Button>
            </div>
          ) : null}
          {pdf.error ? <p className="text-xs text-destructive">{pdf.error}</p> : null}
          <p className="text-xs text-muted-foreground">
            CSV lấy theo bộ lọc hiện tại ở màn Sinh viên. PDF gồm thông tin học phần, kết quả chung,
            CLO/PLO, độ tin cậy đề thi và danh sách sinh viên.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm">Snapshot kỹ thuật</CardTitle>
          <CardDescription>Dữ liệu chi tiết được lưu để xem lại mà không cần tính lại</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Mã lần chạy</p>
            <p className="truncate font-mono text-xs">{snapshot.runId}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Thời điểm</p>
            <p className="text-xs">{formatDateTime(snapshot.ts)}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-[11px] text-muted-foreground">Quy mô</p>
            <p className="text-xs">
              {snapshot.students.length} sinh viên · {snapshot.exams.length} đề
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
