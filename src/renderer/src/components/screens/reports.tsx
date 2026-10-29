import React, { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@renderer/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Progress } from '@renderer/components/ui/progress'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Download,
  FileSpreadsheet,
  FolderOpen,
  Loader2,
  Printer,
  TriangleAlert,
  Upload
} from 'lucide-react'
import { useWorkspace } from '@renderer/lib/workspace'
import { useRunSnapshot } from '@renderer/lib/runs'
import { RunSelector } from '@renderer/components/run-selector'
import { PrintReport } from '@renderer/components/print-report'
import { formatDateTime, formatPercent, formatScore, latestDetailedRun } from '@renderer/lib/format'
import { LichSu } from '@renderer/components/screens/history'
import type { ScreenId } from '@renderer/components/app-shell'
import type { RunHistoryEntryDto, RunSnapshotDto, SessionDto } from '../../../../shared/ipc'
import type { ExamPsychometrics } from '@core/types'

function Kpi({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}): React.ReactElement {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactElement
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const histogramConfig = {
  students: { label: 'Sinh viên', color: 'var(--chart-1)' }
} satisfies ChartConfig

const cloConfig = {
  passedPercent: { label: '% đạt', color: 'var(--chart-1)' }
} satisfies ChartConfig

const alphaConfig = {
  alpha: { label: 'Cronbach α', color: 'var(--chart-2)' }
} satisfies ChartConfig

function OverviewTab({ snapshot }: { snapshot: RunSnapshotDto }): React.ReactElement {
  const { summary, config } = snapshot

  const histogram = useMemo(() => {
    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${i}–${i + 1}`,
      students: 0
    }))
    snapshot.students.forEach((s) => {
      const idx = Math.max(0, Math.min(9, Math.floor(s.courseScore)))
      bins[idx].students += 1
    })
    return bins
  }, [snapshot])

  const cloData = useMemo(
    () =>
      config.cloList.map((clo) => {
        const stat = summary.cloStats[clo.maClo]
        return {
          code: clo.maClo,
          passedPercent: stat?.passedPercent ?? 0,
          below: stat?.isBelowThreshold ?? false
        }
      }),
    [config, summary]
  )

  const alphaData = useMemo(
    () =>
      snapshot.exams.map((exam) => ({
        name: `${exam.maDauDiem}·${exam.maDe}`,
        alpha: exam.cronbachAlpha,
        low: exam.cronbachAlpha <= 0.6
      })),
    [snapshot]
  )

  const median = useMemo(() => {
    const scores = snapshot.students.map((s) => s.courseScore).sort((a, b) => a - b)
    if (scores.length === 0) return 0
    const mid = Math.floor(scores.length / 2)
    return scores.length % 2 === 0 ? (scores[mid - 1] + scores[mid]) / 2 : scores[mid]
  }, [snapshot])

  const attention = useMemo(() => {
    const items: string[] = []
    Object.values(summary.cloStats)
      .filter((stat) => stat.isBelowThreshold)
      .forEach((stat) =>
        items.push(
          `${stat.maClo} chỉ đạt ${formatPercent(stat.passedPercent)} — dưới ngưỡng cảnh báo ${config.quyTac.ty_le_dat_clo_canh_bao}%`
        )
      )
    snapshot.exams
      .filter((exam) => exam.cronbachAlpha <= 0.7)
      .forEach((exam) =>
        items.push(
          `Đề ${exam.maDe} (${exam.maDauDiem}) có α = ${formatScore(exam.cronbachAlpha)} — ${exam.mucDoTinCay}`
        )
      )
    if (summary.absentStudents > 0) {
      items.push(`${summary.absentStudents} sinh viên vắng thi cuối kỳ (tính 0 điểm theo QĐ450)`)
    }
    if (summary.missingDataStudents > 0) {
      items.push(`${summary.missingDataStudents} sinh viên thiếu dữ liệu điểm`)
    }
    return items
  }, [summary, snapshot, config])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Sinh viên" value={String(summary.totalStudents)} hint={`${summary.evaluatedStudents} được đánh giá`} />
        <Kpi
          label="Đạt học phần"
          value={formatPercent(summary.courseStat.passedPercent)}
          hint={`${summary.courseStat.passedCount}/${summary.totalStudents} sinh viên`}
        />
        <Kpi
          label="Điểm trung bình"
          value={formatScore(summary.courseStat.mean)}
          hint={`Trung vị ${formatScore(median)}`}
        />
        <Kpi
          label="Thấp nhất — cao nhất"
          value={`${formatScore(summary.courseStat.min)} – ${formatScore(summary.courseStat.max)}`}
          hint="Thang điểm 10"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Phân bố điểm học phần" description="Số sinh viên theo từng khoảng 1 điểm">
          <ChartContainer config={histogramConfig} className="h-56 w-full">
            <BarChart data={histogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="students" fill="var(--color-students)" radius={4} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard
          title="Tỷ lệ đạt theo CLO"
          description={`Vạch đứt: ngưỡng cảnh báo ${config.quyTac.ty_le_dat_clo_canh_bao}%`}
        >
          <ChartContainer config={cloConfig} className="h-56 w-full">
            <BarChart
              data={cloData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="code"
                width={64}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <ReferenceLine
                x={config.quyTac.ty_le_dat_clo_canh_bao}
                stroke="var(--destructive)"
                strokeDasharray="4 4"
              />
              <Bar dataKey="passedPercent" radius={[0, 4, 4, 0]}>
                {cloData.map((entry) => (
                  <Cell
                    key={entry.code}
                    fill={entry.below ? 'var(--destructive)' : 'var(--color-passedPercent)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Độ tin cậy đề thi" description="Cronbach α theo từng đề (≥ 0.7 là đủ tin cậy)">
          {alphaData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có dữ liệu đề thi.
            </p>
          ) : (
            <ChartContainer config={alphaConfig} className="h-56 w-full">
              <BarChart data={alphaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 1]} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ReferenceLine y={0.7} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <Bar dataKey="alpha" radius={4}>
                  {alphaData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.low ? 'var(--destructive)' : 'var(--color-alpha)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard title="Tỷ lệ đạt theo PLO" description="Chuẩn đầu ra chương trình">
          {Object.keys(summary.ploStats).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Học phần chưa khai báo PLO.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {Object.values(summary.ploStats).map((stat) => (
                <div key={stat.plo} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 font-mono text-xs font-medium">{stat.plo}</span>
                  <Progress
                    value={Math.max(0, Math.min(100, stat.passedPercent))}
                    className="h-2 [&_[data-slot=progress-indicator]]:bg-success"
                  />
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                    {formatPercent(stat.passedPercent)} · TB {formatScore(stat.mean)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cần chú ý</CardTitle>
          <CardDescription>Tổng hợp các điểm cần xử lý trước khi nộp báo cáo</CardDescription>
        </CardHeader>
        <CardContent>
          {attention.length === 0 ? (
            <p className="text-sm text-success">Không có vấn đề nào cần xử lý.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {attention.map((item) => (
                <li key={item} className="flex gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function examKey(exam: ExamPsychometrics): string {
  return `${exam.maDauDiem}__${exam.maDe}`
}

function ExamsTab({ snapshot }: { snapshot: RunSnapshotDto }): React.ReactElement {
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

function ExportTab({
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

export function BaoCao({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const latest = latestDetailedRun(active)
  const [runId, setRunId] = useState<string>(latest?.runId ?? '')
  const { snapshot, loading, error } = useRunSnapshot(runId || undefined)
  const [tab, setTab] = useState('overview')

  if (!active) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <FileSpreadsheet className="text-muted-foreground/40" />
          <EmptyTitle>Chưa có môn học</EmptyTitle>
          <EmptyDescription>
            Thêm môn học và nhập điểm để xem thống kê, biểu đồ và xuất báo cáo.
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
          <FileSpreadsheet className="text-muted-foreground/40" />
          <EmptyTitle>
            {active.history.length > 0 ? 'Lần chạy cũ chưa lưu chi tiết' : 'Chưa có báo cáo nào'}
          </EmptyTitle>
          <EmptyDescription>
            {active.history.length > 0
              ? 'Các lần chạy trước phiên bản này chỉ lưu số tổng hợp. Chạy lại “Nhập điểm” để xem báo cáo đầy đủ.'
              : 'Nhập file Config và file điểm thô để ứng dụng tính toán và tạo báo cáo.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </Empty>
    )
  }

  const currentRun = active.history.find((run) => run.runId === runId) ?? latest

  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <RunSelector session={active} runId={runId} onSelect={setRunId} />
            <p className="text-xs text-muted-foreground">
              {active.courseName}
              {active.lop ? ` · Lớp ${active.lop}` : ''}
              {snapshot ? ` · ${snapshot.students.length} sinh viên` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onScreen('import')}>
              <Upload data-icon="inline-start" />
              Nhập điểm
            </Button>
            <Button size="sm" onClick={() => setTab('export')}>
              <Download data-icon="inline-start" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <TriangleAlert className="size-4" />
          {error}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="exams">Phân tích đề thi</TabsTrigger>
          <TabsTrigger value="history">Lịch sử chạy</TabsTrigger>
          <TabsTrigger value="export">Xuất báo cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading || !snapshot ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Skeleton className="h-56 rounded-xl" />
              <Skeleton className="h-56 rounded-xl" />
              <Skeleton className="h-56 rounded-xl" />
              <Skeleton className="h-56 rounded-xl" />
            </div>
          ) : (
            <OverviewTab snapshot={snapshot} />
          )}
        </TabsContent>

        <TabsContent value="exams">
          {loading || !snapshot ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <ExamsTab snapshot={snapshot} />
          )}
        </TabsContent>

        <TabsContent value="history">
          <LichSu sessionId={active.id} />
        </TabsContent>

        <TabsContent value="export">
          {loading || !snapshot ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <ExportTab
              run={currentRun}
              snapshot={snapshot}
              session={active}
              onScreen={onScreen}
            />
          )}
        </TabsContent>
      </Tabs>
      </div>

      {snapshot ? (
        <PrintReport snapshot={snapshot} session={active} run={currentRun} />
      ) : null}
    </>
  )
}
