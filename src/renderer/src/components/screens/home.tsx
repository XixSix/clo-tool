import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'
import {
  BookOpen,
  ChartColumn,
  ChevronRight,
  CircleCheck,
  FileSpreadsheet,
  FolderPlus,
  Play,
  Trash2,
  TriangleAlert,
  Users
} from 'lucide-react'
import { cn } from 'cn'
import { useWorkspace } from '@renderer/lib/workspace'
import { hasBridge } from '@renderer/lib/theme'
import { formatPercent, formatScore } from '@renderer/lib/format'
import type { SessionDto } from '../../../../shared/ipc'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@renderer/components/ui/chart'
import type { ScreenId } from '@renderer/components/app-shell'

const passChartConfig = {
  pass: { label: '% đạt', color: 'var(--chart-1)' }
} satisfies ChartConfig

interface AttentionItem {
  id: string
  title: string
  hint: string
  level: 'warning' | 'muted'
  screen: ScreenId
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hôm qua'
  return `${d} ngày trước`
}

interface ActionCardProps {
  icon: React.ElementType
  title: string
  desc: string
  onClick: () => void
}

function ActionCard({ icon: Icon, title, desc, onClick }: ActionCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-1.5 rounded-xl bg-card p-5 text-left ring-1 ring-foreground/10 transition hover:shadow-md hover:ring-primary/50"
    >
      <Icon className="size-5 text-primary" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/80">{desc}</p>
    </button>
  )
}

function ActivityRow({
  session,
  ts,
  onOpen
}: {
  session: SessionDto
  ts: number
  onOpen: () => void
}): React.ReactElement {
  const run = session.history[session.history.length - 1]
  const achieved = run ? run.passedPercent >= 60 : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition hover:shadow-sm hover:ring-primary/40"
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          achieved === null ? 'bg-muted-foreground/40' : achieved ? 'bg-success' : 'bg-destructive'
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">
          {session.maHp} — {session.courseName}
        </p>
        <p className="text-[11px] text-muted-foreground/70">
          {session.lop ? `${session.lop} · ` : ''}
          {run
            ? `${run.studentCount} SV · ${formatPercent(run.passedPercent)} đạt`
            : `${session.soTinChi} tín chỉ · chưa chạy`}
        </p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground/60">{timeAgo(ts)}</span>
      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
    </button>
  )
}

function StatTile({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}): React.ReactElement {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function TrangChu({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { ws, loading, setActiveSession } = useWorkspace()
  const bridgeReady = hasBridge()

  async function createSamples(): Promise<void> {
    if (!bridgeReady) return
    try {
      const dir = await window.api.pickDirectory()
      if (!dir) return
      const created = await window.api.createSamples(dir)
      if (!created.ok) throw new Error(created.error ?? 'Không tạo được file mẫu.')
      await window.api.openPath(created.dir)
    } catch (err) {
      console.error(err)
    }
  }

  const activities = (ws?.sessions ?? [])
    .filter((s) => s.history.length > 0)
    .sort((a, b) => {
      const ta = a.history[a.history.length - 1].ts
      const tb = b.history[b.history.length - 1].ts
      return tb - ta
    })
    .slice(0, 5)

  const sessions = ws?.sessions ?? []
  const runs = sessions.map((s) => s.history[s.history.length - 1]).filter(Boolean)
  const totalStudents = runs.reduce((sum, run) => sum + run.studentCount, 0)
  const totalRuns = sessions.reduce((sum, s) => sum + s.history.length, 0)
  const avgPass =
    runs.length > 0 ? runs.reduce((sum, run) => sum + run.passedPercent, 0) / runs.length : 0

  // Biểu đồ: tỷ lệ đạt của lần chạy gần nhất theo từng môn
  const passByCourse = sessions
    .map((s) => {
      const run = s.history[s.history.length - 1]
      return run
        ? { id: s.id, code: s.maHp, pass: run.passedPercent, low: run.passedPercent < 50 }
        : null
    })
    .filter((item): item is { id: string; code: string; pass: number; low: boolean } => !!item)
    .sort((a, b) => a.pass - b.pass)

  // Danh sách cần chú ý: môn chưa nhập điểm hoặc tỷ lệ đạt dưới 50%
  const attention: AttentionItem[] = sessions
    .flatMap((s): AttentionItem[] => {
      const run = s.history[s.history.length - 1]
      if (!run) {
        return [
          {
            id: s.id,
            title: `${s.maHp} chưa nhập điểm`,
            hint: 'Chạy Nhập điểm để có dữ liệu đánh giá',
            level: 'muted',
            screen: 'import'
          }
        ]
      }
      if (run.passedPercent < 50) {
        return [
          {
            id: s.id,
            title: `${s.maHp} chỉ đạt ${formatPercent(run.passedPercent)}`,
            hint: `${run.studentCount} SV · điểm TB ${formatScore(run.meanCourseScore)}`,
            level: 'warning',
            screen: 'reports'
          }
        ]
      }
      return []
    })
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold">Xin chào! 👋</h2>
        <p className="mt-1 text-[13px] text-muted-foreground/80">
          Chọn một môn học hoặc tạo mới để bắt đầu đánh giá CLO/PLO theo QĐ 450.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Môn học" value={String(sessions.length)} hint="Đang quản lý" />
        <StatTile label="Sinh viên" value={String(totalStudents)} hint="Theo lần chạy gần nhất" />
        <StatTile label="Tỷ lệ đạt TB" value={formatPercent(avgPass)} hint="Trung bình các môn" />
        <StatTile label="Lần chạy" value={String(totalRuns)} hint="Đã lưu trong lịch sử" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={FolderPlus}
          title="Thêm môn học"
          desc="Tạo cấu hình học phần mới với file Config"
          onClick={() => onScreen('courses')}
        />
        <ActionCard
          icon={Play}
          title="Nhập điểm"
          desc="Nạp file Config + điểm thô và tính CLO/PLO"
          onClick={() => onScreen('import')}
        />
        <ActionCard
          icon={Users}
          title="Xem sinh viên"
          desc="Danh sách sinh viên, lọc đạt/không đạt, xem vết điểm"
          onClick={() => onScreen('students')}
        />
        <ActionCard
          icon={ChartColumn}
          title="Xem báo cáo"
          desc="Thống kê, biểu đồ CLO/PLO và xuất báo cáo"
          onClick={() => onScreen('reports')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Tỷ lệ đạt theo môn</p>
              <p className="text-[11px] text-muted-foreground/70">
                Lần chạy gần nhất · vạch đứt là ngưỡng 50%
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground/60">{sessions.length} môn</span>
          </div>

          {loading ? (
            <Skeleton className="mt-3 h-[190px] rounded-lg" />
          ) : passByCourse.length === 0 ? (
            <div className="flex h-[190px] flex-col items-center justify-center gap-1 text-center">
              <ChartColumn className="size-5 text-muted-foreground/40" />
              <p className="text-xs font-medium">Chưa có dữ liệu để vẽ</p>
              <p className="text-[11px] text-muted-foreground/70">
                Chạy Nhập điểm cho ít nhất một môn học
              </p>
            </div>
          ) : (
            <ChartContainer config={passChartConfig} className="mt-3 h-[190px] w-full">
              <BarChart
                data={passByCourse}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tickFormatter={(value: number) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="code"
                  width={76}
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <ReferenceLine x={50} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent labelKey="code" />}
                />
                <Bar dataKey="pass" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
                  {passByCourse.map((item) => (
                    <Cell
                      key={item.id}
                      fill={item.low ? 'var(--destructive)' : 'var(--color-pass)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">Cần chú ý</p>
              <p className="text-[11px] text-muted-foreground/70">
                Môn chưa nhập điểm hoặc tỷ lệ đạt dưới 50%
              </p>
            </div>
            {attention.length > 0 ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                {attention.length}
              </span>
            ) : null}
          </div>

          {loading ? (
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : attention.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center">
              <CircleCheck className="size-5 text-success" />
              <p className="text-xs font-medium">Không có môn nào cần chú ý</p>
              <p className="text-[11px] text-muted-foreground/70">
                Mọi môn đã có dữ liệu và tỷ lệ đạt từ 50% trở lên
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-1.5">
              {attention.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSession(item.id)
                    onScreen(item.screen)
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-muted/60"
                >
                  {item.level === 'warning' ? (
                    <TriangleAlert className="size-4 shrink-0 text-destructive" />
                  ) : (
                    <BookOpen className="size-4 shrink-0 text-muted-foreground/60" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium">{item.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground/70">{item.hint}</p>
                  </div>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={createSamples}
          className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs font-medium ring-1 ring-foreground/10 transition hover:shadow-sm"
        >
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          Tạo bộ file mẫu KTLT101
        </button>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Hoạt động gần đây</p>
          <button
            type="button"
            onClick={() => onScreen('reports')}
            className="text-xs font-medium text-primary hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        {loading ? (
          <>
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <Trash2 className="mx-auto size-4 text-muted-foreground/40" />
            <p className="mt-2 text-[13px] font-medium">Chưa có hoạt động nào</p>
            <p className="text-xs text-muted-foreground/70">
              Thêm môn học hoặc tạo bộ file mẫu để thử nghiệm
            </p>
          </div>
        ) : (
          activities.map((s) => {
            const run = s.history[s.history.length - 1]
            return (
              <ActivityRow
                key={s.id}
                session={s}
                ts={run.ts}
                onOpen={() => {
                  setActiveSession(s.id)
                  onScreen('reports')
                }}
              />
            )
          })
        )}
      </div>

      {activities.length === 0 && !loading ? (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <BookOpen className="size-3.5" />
          Mẹo: nhấp vào môn học ở đáy thanh bên để mở nhanh màn Nhập điểm.
        </p>
      ) : null}
    </div>
  )
}
