import React, { useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { formatScore } from '@renderer/lib/format'
import type { RunSnapshotDto } from '../../../../../shared/ipc'
import type { ExamPsychometrics } from '@core/types'

function examKey(exam: ExamPsychometrics): string {
  return `${exam.maDauDiem}__${exam.maDe}`
}

export function ExamsTab({ snapshot }: { snapshot: RunSnapshotDto }): React.ReactElement {
  const [selectedKey, setSelectedKey] = useState('')
  const selected =
    snapshot.exams.find((exam) => examKey(exam) === selectedKey) ?? snapshot.exams[0] ?? null

  if (!selected) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <FileSpreadsheet className="text-muted-foreground/40" />
          <EmptyTitle>Không có dữ liệu phân tích đề thi</EmptyTitle>
          <EmptyDescription>
            Học phần chưa khai báo câu hỏi / đề thi trong file Config.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={examKey(selected)} onValueChange={setSelectedKey}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Chọn đề thi" />
          </SelectTrigger>
          <SelectContent>
            {snapshot.exams.map((exam) => (
              <SelectItem key={examKey(exam)} value={examKey(exam)}>
                {exam.maDauDiem} · Đề {exam.maDe}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{selected.soSinhVien} sinh viên</Badge>
        <Badge variant="outline">{selected.soCauHoi} câu hỏi</Badge>
        <Badge variant={selected.cronbachAlpha >= 0.7 ? 'secondary' : 'destructive'}>
          α {formatScore(selected.cronbachAlpha)} · {selected.mucDoTinCay}
        </Badge>
        {selected.canhBaoCoMauN ? (
          <span className="text-xs text-warning">{selected.canhBaoCoMauN}</span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Câu</TableHead>
              <TableHead className="text-right">Điểm tối đa</TableHead>
              <TableHead className="text-right">Điểm TB</TableHead>
              <TableHead className="text-right">p</TableHead>
              <TableHead>Độ khó</TableHead>
              <TableHead className="text-right">d</TableHead>
              <TableHead>Phân biệt</TableHead>
              <TableHead className="text-right">α nếu bỏ</TableHead>
              <TableHead>Cảnh báo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selected.items.map((item) => (
              <TableRow key={item.cau}>
                <TableCell className="font-medium">{item.cau}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatScore(item.diemToiDa)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatScore(item.diemTrungBinh)}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatScore(item.doKhoP)}
                </TableCell>
                <TableCell className="text-xs">{item.mucDoKho}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatScore(item.doPhanBietD)}
                </TableCell>
                <TableCell className="text-xs">{item.mucDoPhanBiet}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {formatScore(item.alphaNeuBoCau)}
                </TableCell>
                <TableCell className="text-xs text-destructive">{item.canhBao ?? ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
