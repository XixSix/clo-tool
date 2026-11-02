import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'
import { BookOpen, ChartColumn, ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@renderer/components/ui/chart'
import type { AttentionItem, PassByCourseItem } from '@renderer/components/screens/home/overview-data'

const passChartConfig = {
  pass: { label: '% đạt', color: 'var(--chart-1)' }
} satisfies ChartConfig

/** Hai card cạnh nhau: tỷ lệ đạt theo môn và danh sách môn cần chú ý. */
export function OverviewGrid({
  passByCourse,
  attention,
  sessionCount,
  loading,
  onOpenAttention
}: {
  passByCourse: PassByCourseItem[]
  attention: AttentionItem[]
  sessionCount: number
  loading: boolean
  onOpenAttention: (item: AttentionItem) => void
}): React.ReactElement {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Tỷ lệ đạt theo môn</p>
            <p className="text-[11px] text-muted-foreground/70">
              Lần chạy gần nhất · vạch đứt là ngưỡng 50%
            </p>
          </div>
          <span className="text-[11px] text-muted-foreground/60">{sessionCount} môn</span>
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
              <ChartTooltip cursor={false} content={<ChartTooltipContent labelKey="code" />} />
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
                onClick={() => onOpenAttention(item)}
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
  )
}
