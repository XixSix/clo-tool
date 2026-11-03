import React from 'react'
import { FolderOpen, History, FileText } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { useWorkspace } from '@renderer/hooks/workspace'
import { formatDateTime } from '@renderer/lib/format'
import type { RunHistoryEntryDto, SessionDto } from '../../../shared/ipc'

interface MergedRow {
  session: SessionDto
  run: RunHistoryEntryDto
}

/** Bảng lịch sử chạy — dùng ở tab "Lịch sử chạy" của Báo cáo và trang chi tiết môn. */
export function LichSu({ sessionId }: { sessionId?: string }): React.ReactElement {
  const { ws } = useWorkspace()

  const rows: MergedRow[] = (ws?.sessions ?? [])
    .filter((s) => !sessionId || s.id === sessionId)
    .flatMap((s) => s.history.map((run) => ({ session: s, run })))
    .sort((a, b) => b.run.ts - a.run.ts)

  if (rows.length === 0) {
    return (
      <Empty className="border-border rounded-xl border border-dashed">
        <EmptyHeader>
          <History className="text-muted-foreground/40" />
          <EmptyTitle>
            {sessionId ? 'Môn này chưa có lần chạy nào' : 'Chưa có lần chạy nào'}
          </EmptyTitle>
          <EmptyDescription>
            Lịch sử nằm tại đây sau khi bạn nhập điểm và xuất báo cáo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Thời điểm</TableHead>
            <TableHead>Môn học</TableHead>
            <TableHead className="text-right">SV</TableHead>
            <TableHead className="text-right">% đạt</TableHead>
            <TableHead className="text-right">Điểm TB</TableHead>
            <TableHead className="w-72 text-right">Mở</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ session, run }) => (
            <TableRow key={`${session.id}-${run.ts}`}>
              <TableCell className="text-muted-foreground text-xs">
                {formatDateTime(run.ts)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold">{session.maHp}</span>
                  {session.lop ? <Badge variant="outline">{session.lop}</Badge> : null}
                </div>
                <p className="text-muted-foreground text-xs">{session.courseName}</p>
              </TableCell>
              <TableCell className="text-right font-mono text-[13px]">{run.studentCount}</TableCell>
              <TableCell className="text-right font-mono text-[13px]">
                <span className={run.passedPercent >= 60 ? 'text-success' : 'text-destructive'}>
                  {run.passedPercent}%
                </span>
              </TableCell>
              <TableCell className="text-right font-mono text-[13px]">
                {run.meanCourseScore}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.api.openPath(run.outputDir)}
                  >
                    <FolderOpen data-icon="inline-start" />
                    Thư mục
                  </Button>
                  {run.finalReportPath ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.api.openPath(run.finalReportPath!)}
                    >
                      <FileText data-icon="inline-start" />
                      Bảng điểm
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
