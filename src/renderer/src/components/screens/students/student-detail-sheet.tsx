import React from 'react'
import { FileText } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@renderer/components/ui/sheet'
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
import type { ProcessedStudentResult } from '@core/types'

/** Sheet chi tiết một sinh viên: điểm nhóm, CLO, PLO, vết tính điểm và cảnh báo. */
export function StudentDetailSheet({
  student,
  snapshot,
  onClose
}: {
  student: ProcessedStudentResult | null
  snapshot: RunSnapshotDto
  onClose: () => void
}): React.ReactElement {
  const threshold = snapshot.config.quyTac.nguong_dat_clo
  const cloCodes = snapshot.config.cloList.map((c) => c.maClo)
  const cellEntries = student ? Object.values(student.cellScores) : []

  return (
    <Sheet open={Boolean(student)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {student ? (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2">
                {student.hoTen}
                <Badge variant="secondary" className="font-mono">
                  {student.maSv}
                </Badge>
                {student.isPassedHp ? (
                  <Badge variant="outline">Đạt học phần</Badge>
                ) : (
                  <Badge variant="destructive">Không đạt</Badge>
                )}
              </SheetTitle>
              <SheetDescription>
                {[
                  student.ngaySinh ? `Ngày sinh: ${student.ngaySinh}` : null,
                  student.maDe ? `Mã đề: ${student.maDe}` : null,
                  student.isAbsentFinal ? 'Vắng thi cuối kỳ' : null,
                  student.hasMissingData ? 'Thiếu dữ liệu điểm' : null
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Đầy đủ dữ liệu điểm'}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-5 px-4 pb-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold">{formatScore(student.courseScore)}</p>
                  <p className="text-[11px] text-muted-foreground">Điểm học phần</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold">{formatScore(student.tbcClo)}</p>
                  <p className="text-[11px] text-muted-foreground">TBC CLO</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xl font-bold">{formatScore(student.tbQuaTrinh)}</p>
                  <p className="text-[11px] text-muted-foreground">TB quá trình</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Điểm theo nhóm
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['CC', 'GK', 'CK'] as const).map((group) => {
                    const detail = student.groupScores[group]
                    return (
                      <div key={group} className="rounded-lg px-3 py-2 ring-1 ring-foreground/10">
                        <p className="text-[11px] text-muted-foreground">{group}</p>
                        <p className="font-mono text-base font-semibold">{formatScore(detail?.score)}</p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {detail?.cloCodes.join(', ') || '—'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Kết quả CLO (ngưỡng {threshold})
                </h3>
                <div className="flex flex-col gap-2">
                  {cloCodes.map((code) => {
                    const score = student.cloScores[code] ?? 0
                    const passed = score >= threshold
                    return (
                      <div key={code} className="flex items-center gap-3 text-sm">
                        <span className="w-14 shrink-0 font-medium">{code}</span>
                        <Progress
                          value={Math.max(0, Math.min(100, score * 10))}
                          className={
                            passed
                              ? 'h-2 [&_[data-slot=progress-indicator]]:bg-success'
                              : 'h-2 [&_[data-slot=progress-indicator]]:bg-destructive'
                          }
                        />
                        <span className="w-10 text-right font-mono text-xs">{formatScore(score)}</span>
                        <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">
                          {passed ? 'Đạt' : 'Không đạt'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {Object.keys(student.ploScores).length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    PLO
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(student.ploScores).map(([code, score]) => (
                      <Badge key={code} variant="outline" className="font-mono">
                        {code} · {formatScore(score)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vết tính điểm ({cellEntries.length} ô)
                </h3>
                <div className="max-h-64 overflow-auto rounded-lg ring-1 ring-foreground/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Đầu điểm</TableHead>
                        <TableHead>CLO</TableHead>
                        <TableHead className="text-right">Điểm</TableHead>
                        <TableHead className="text-right">Đạt/Max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cellEntries.map((cell) => (
                        <TableRow key={`${cell.maDauDiem}_${cell.maClo}`}>
                          <TableCell className="text-xs">{cell.maDauDiem}</TableCell>
                          <TableCell className="text-xs">{cell.maClo}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatScore(cell.score)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatScore(cell.totalEarned)}/{formatScore(cell.totalMax)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {student.issues.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cảnh báo
                  </h3>
                  <ul className="flex flex-col gap-1.5 rounded-lg bg-muted p-3 text-xs">
                    {student.issues.map((issue, idx) => (
                      <li key={`${issue.message}-${idx}`} className="flex gap-1.5">
                        <span
                          className={
                            issue.level === 'error'
                              ? 'mt-1 size-1.5 shrink-0 rounded-full bg-destructive'
                              : 'mt-1 size-1.5 shrink-0 rounded-full bg-warning'
                          }
                        />
                        <span className="text-muted-foreground">{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <SheetFooter className="flex-row flex-wrap gap-2 border-t">
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Xuất phiếu điểm sẽ bổ sung sau"
              >
                <FileText data-icon="inline-start" />
                In phiếu điểm
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Mở file điểm gốc sẽ bổ sung sau"
              >
                Mở file điểm gốc
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
