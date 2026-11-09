import React from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@renderer/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { TriangleAlert } from 'lucide-react'
import { formatPercent, formatScore } from '@renderer/lib/format'
import { ChartCard, Kpi } from '@renderer/components/screens/reports/shared'
import {
  alphaConfig,
  buildAlphaData,
  buildAttention,
  buildCloData,
  buildHistogram,
  cloConfig,
  histogramConfig,
  medianCourseScore
} from '@renderer/components/screens/reports/report-data'
import { toSummaryView } from '@renderer/lib/result-view'
import type { RunSnapshotDto } from '../../../../../shared/ipc'

export function OverviewTab({ snapshot }: { snapshot: RunSnapshotDto }): React.ReactElement {
  const { config } = snapshot
  const summary = toSummaryView(snapshot.summary, config)
  const histogram = buildHistogram(snapshot)
  const cloData = buildCloData(snapshot)
  const alphaData = buildAlphaData(snapshot)
  const median = medianCourseScore(snapshot)
  const attention = buildAttention(snapshot)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Sinh viên"
          value={String(summary.totalStudents)}
          hint={`${summary.evaluatedStudents} được đánh giá`}
        />
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
          description={`Vạch đứt: ngưỡng cảnh báo ${config.quyTac.tyLeDatCloCanhBao}%`}
        >
          <ChartContainer config={cloConfig} className="h-56 w-full">
            <BarChart
              data={cloData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="code" width={64} tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <ReferenceLine
                x={config.quyTac.tyLeDatCloCanhBao}
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

        <ChartCard
          title="Độ tin cậy đề thi"
          description="Cronbach α theo từng đề (≥ 0.7 là đủ tin cậy)"
        >
          {alphaData.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
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
            <p className="text-muted-foreground py-8 text-center text-sm">
              Học phần chưa khai báo PLO.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {Object.values(summary.ploStats).map((stat) => (
                <div key={stat.plo} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 font-mono text-xs font-medium">{stat.plo}</span>
                  <Progress
                    value={Math.max(0, Math.min(100, stat.passedPercent))}
                    className="[&_[data-slot=progress-indicator]]:bg-success h-2"
                  />
                  <span className="text-muted-foreground w-24 shrink-0 text-right text-xs">
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
            <p className="text-success text-sm">Không có vấn đề nào cần xử lý.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {attention.map((item) => (
                <li key={item} className="flex gap-2">
                  <TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
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
