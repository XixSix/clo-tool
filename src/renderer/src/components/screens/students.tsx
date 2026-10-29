import React, { useMemo, useState } from 'react'
import { Download, FileText, Search, TriangleAlert, Upload, Users } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Progress } from '@renderer/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
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
import { useWorkspace } from '@renderer/lib/workspace'
import { useRunSnapshot } from '@renderer/lib/runs'
import { RunSelector } from '@renderer/components/run-selector'
import {
  downloadCsv,
  formatScore,
  latestDetailedRun
} from '@renderer/lib/format'
import type { ScreenId } from '@renderer/components/app-shell'
import type { RunSnapshotDto } from '../../../../shared/ipc'
import type { ProcessedStudentResult } from '@core/types'

type FilterId = 'all' | 'pass' | 'fail' | 'absent' | 'missing' | 'warning'

const FILTER_LABELS: Record<FilterId, string> = {
  all: 'Tất cả',
  pass: 'Đạt',
  fail: 'Không đạt',
  absent: 'Vắng thi',
  missing: 'Thiếu điểm',
  warning: 'Cảnh báo'
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function ScoreCell({ value }: { value: number | undefined }): React.ReactElement {
  return <span className="font-mono text-[13px] tabular-nums">{formatScore(value)}</span>
}

function StudentDetailSheet({
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

export function SinhVien({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const latest = latestDetailedRun(active)
  const [runId, setRunId] = useState<string>(latest?.runId ?? '')
  const [filter, setFilter] = useState<FilterId>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ProcessedStudentResult | null>(null)
  const { snapshot, loading, error } = useRunSnapshot(runId || undefined)

  const threshold = snapshot?.config.quyTac.nguong_dat_clo ?? 4

  const rows = useMemo(() => {
    if (!snapshot) return []
    return snapshot.students.map((student) => {
      const cloCodes = Object.keys(student.cloScores)
      const passedClos = cloCodes.filter((code) => (student.cloScores[code] ?? 0) >= threshold).length
      return { student, passedClos, totalClos: cloCodes.length }
    })
  }, [snapshot, threshold])

  const counts = useMemo(() => {
    const base: Record<FilterId, number> = {
      all: rows.length,
      pass: 0,
      fail: 0,
      absent: 0,
      missing: 0,
      warning: 0
    }
    rows.forEach(({ student }) => {
      if (student.isPassedHp) base.pass += 1
      else base.fail += 1
      if (student.isAbsentFinal) base.absent += 1
      if (student.hasMissingData) base.missing += 1
      if (student.issues.length > 0) base.warning += 1
    })
    return base
  }, [rows])

  const visible = useMemo(() => {
    const q = normalize(query.trim())
    return rows.filter(({ student }) => {
      if (filter === 'pass' && !student.isPassedHp) return false
      if (filter === 'fail' && student.isPassedHp) return false
      if (filter === 'absent' && !student.isAbsentFinal) return false
      if (filter === 'missing' && !student.hasMissingData) return false
      if (filter === 'warning' && student.issues.length === 0) return false
      if (!q) return true
      return normalize(student.hoTen).includes(q) || normalize(student.maSv).includes(q)
    })
  }, [rows, filter, query])

  function exportCsv(): void {
    if (!active || !snapshot) return
    const header = [
      'TT',
      'Mã SV',
      'Họ tên',
      'Ngày sinh',
      'Mã đề',
      'CC',
      'GK',
      'CK',
      'TBC CLO',
      'Điểm học phần',
      'Kết quả',
      'CLO đạt',
      'Cảnh báo'
    ]
    const body = visible.map(({ student, passedClos, totalClos }) => [
      student.tt,
      student.maSv,
      student.hoTen,
      student.ngaySinh ?? '',
      student.maDe ?? '',
      formatScore(student.groupScores.CC?.score),
      formatScore(student.groupScores.GK?.score),
      formatScore(student.groupScores.CK?.score),
      formatScore(student.tbcClo),
      formatScore(student.courseScore),
      student.isPassedHp ? 'Đạt' : 'Không đạt',
      `${passedClos}/${totalClos}`,
      student.issues.map((i) => i.message).join(' | ')
    ])
    downloadCsv(
      `sinh-vien_${active.maHp}${active.lop ? `_${active.lop}` : ''}.csv`,
      [header, ...body]
    )
  }

  if (!active) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <Users className="text-muted-foreground/40" />
          <EmptyTitle>Chưa có môn học</EmptyTitle>
          <EmptyDescription>
            Thêm môn học và nhập điểm để xem danh sách sinh viên cùng kết quả CLO/PLO.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('courses')}>Quản lý môn học</Button>
      </Empty>
    )
  }

  if (!latest) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <Users className="text-muted-foreground/40" />
          <EmptyTitle>
            {active.history.length > 0 ? 'Lần chạy cũ chưa lưu chi tiết' : 'Chưa có kết quả học phần'}
          </EmptyTitle>
          <EmptyDescription>
            {active.history.length > 0
              ? 'Các lần chạy trước phiên bản này chỉ lưu số tổng hợp. Chạy lại “Nhập điểm” để xem chi tiết từng sinh viên.'
              : 'Nhập file Config và file điểm thô để ứng dụng tính toán và lưu kết quả từng sinh viên.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <RunSelector session={active} runId={runId} onSelect={setRunId} />
          {snapshot ? (
            <p className="text-xs text-muted-foreground">
              {active.courseName}
              {active.lop ? ` · Lớp ${active.lop}` : ''} · {snapshot.students.length} sinh viên
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!snapshot || visible.length === 0}>
            <Download data-icon="inline-start" />
            Xuất CSV
          </Button>
          <Button size="sm" onClick={() => onScreen('import')}>
            <Upload data-icon="inline-start" />
            Nhập điểm
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as FilterId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? 'secondary' : 'ghost'}
            className="rounded-full"
            onClick={() => setFilter(id)}
          >
            {FILTER_LABELS[id]}
            <span className="ml-1 text-xs text-muted-foreground">{counts[id]}</span>
          </Button>
        ))}
        <span className="flex-1" />
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Tìm sinh viên"
            placeholder="Tìm mã SV hoặc họ tên…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <TriangleAlert className="size-4" />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">TT</TableHead>
              <TableHead className="w-28">Mã SV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead className="text-right">CC</TableHead>
              <TableHead className="text-right">GK</TableHead>
              <TableHead className="text-right">CK</TableHead>
              <TableHead className="text-right">TBC CLO</TableHead>
              <TableHead className="text-right">Điểm HP</TableHead>
              <TableHead className="w-28">Kết quả</TableHead>
              <TableHead className="w-24 text-center">CLO đạt</TableHead>
              <TableHead className="w-16 text-center">Lưu ý</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={11}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-32 text-center text-sm text-muted-foreground">
                  Không tìm thấy sinh viên phù hợp bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              visible.map(({ student, passedClos, totalClos }) => (
                <TableRow
                  key={student.maSv}
                  className="cursor-pointer"
                  onClick={() => setSelected(student)}
                >
                  <TableCell className="text-xs text-muted-foreground">{student.tt}</TableCell>
                  <TableCell className="font-mono text-[13px]">{student.maSv}</TableCell>
                  <TableCell>
                    <p className="text-[13px] font-medium">{student.hoTen}</p>
                    {student.maDe ? (
                      <p className="text-[11px] text-muted-foreground">Đề {student.maDe}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <ScoreCell value={student.groupScores.CC?.score} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ScoreCell value={student.groupScores.GK?.score} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ScoreCell value={student.groupScores.CK?.score} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ScoreCell value={student.tbcClo} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-[13px] font-semibold">
                    {formatScore(student.courseScore)}
                  </TableCell>
                  <TableCell>
                    {student.isPassedHp ? (
                      <Badge variant="secondary">Đạt</Badge>
                    ) : (
                      <Badge variant="destructive">Không đạt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {passedClos}/{totalClos}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {student.isAbsentFinal || student.hasMissingData || student.issues.length > 0 ? (
                      <TriangleAlert
                        className={
                          student.isAbsentFinal || student.hasMissingData
                            ? 'mx-auto size-4 text-destructive'
                            : 'mx-auto size-4 text-warning'
                        }
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Hiển thị {visible.length}/{rows.length} sinh viên. Nhấn vào một dòng để xem chi tiết và vết
        tính điểm.
      </p>

      {snapshot ? (
        <StudentDetailSheet student={selected} snapshot={snapshot} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  )
}
