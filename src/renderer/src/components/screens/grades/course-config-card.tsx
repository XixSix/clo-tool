import React from 'react'
import { CheckCircle, AlertCircle, FileCog, Download } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import type { CourseConfig } from '@core/types/course'
import { cn } from 'cn'

interface CourseConfigCardProps {
  config: CourseConfig | null
}

/** Hiển thị tóm tắt cấu hình môn học đã lưu trong ứng dụng */
export function CourseConfigCard({ config }: CourseConfigCardProps): React.ReactElement {
  if (!config) {
    return (
      <Card className="border-border border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileCog className="text-muted-foreground size-4" />
            Cấu hình môn học
          </CardTitle>
          <CardDescription>Chưa có cấu hình cho môn này</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground py-6 text-center">
          <p className="text-sm">
            Vào <strong>Chi tiết môn → Cấu hình CLO/PLO</strong> để nhập cấu hình.
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalCloWeight = config.cloList.reduce((sum, c) => sum + (c.trongSoClo || 1), 0)
  const totalPlanWeight = config.keHoachDanhGia.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
  const cloWeightOk = Math.abs(totalCloWeight - 100) < 0.01
  const planWeightOk = Math.abs(totalPlanWeight - 100) < 0.01

  // Check exam scores
  const maxScores: Record<string, number> = {}
  for (const q of config.cauHoi) {
    const key = `${q.maDauDiem}|${q.maDe || 'ALL'}`
    maxScores[key] = (maxScores[key] || 0) + q.diemToiDa
  }
  const examScoresOk = Object.entries(maxScores).every(([, score]) => Math.abs(score - 10) < 0.01)
  const hasExams = Object.keys(maxScores).length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileCog className="size-4" />
          Cấu hình môn học
        </CardTitle>
        <CardDescription>Được nhập trực tiếp trong ứng dụng, lưu tự động</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">CLO</p>
            <p className="font-semibold">{config.cloList.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Đầu điểm</p>
            <p className="font-semibold">{config.keHoachDanhGia.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">Câu hỏi</p>
            <p className="font-semibold">{config.cauHoi.length}</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-muted-foreground text-xs">PLO mapping</p>
            <p className="font-semibold">{config.maTranPlo.length}</p>
          </div>
        </div>

        {/* CLO weights */}
        <div
          className={cn(
            'flex items-center gap-2 text-xs',
            cloWeightOk ? 'text-success' : 'text-destructive'
          )}
        >
          {cloWeightOk ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
          <span>Tổng trọng số CLO: {totalCloWeight.toFixed(2)}%</span>
        </div>

        {/* Plan weights */}
        <div
          className={cn(
            'flex items-center gap-2 text-xs',
            planWeightOk ? 'text-success' : 'text-destructive'
          )}
        >
          {planWeightOk ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
          <span>Tổng trọng số kế hoạch: {totalPlanWeight.toFixed(2)}%</span>
        </div>

        {/* Exam scores */}
        {hasExams && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs',
              examScoresOk ? 'text-success' : 'text-destructive'
            )}
          >
            {examScoresOk ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
            <span>
              Đề thi: {examScoresOk ? 'Tổng điểm các đề = 10 ✓' : 'Có đề không đạt 10 điểm'}
            </span>
          </div>
        )}

        {/* Assessment plan summary */}
        {config.keHoachDanhGia.length > 0 && (
          <div className="border-border/50 space-y-1 border-t pt-3">
            <p className="text-muted-foreground text-xs font-medium">Kế hoạch đánh giá:</p>
            {config.keHoachDanhGia.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[12px]">
                <Badge variant="outline" className="shrink-0 px-1.5 py-0.5 text-[10px]">
                  {item.nhom}
                </Badge>
                <span className="text-muted-foreground font-mono">{item.maDauDiem}</span>
                <span className="truncate">{item.thanhPhan}</span>
                <span className="text-success text-right font-mono">{item.trongSoPhanTram}%</span>
                <span className="text-muted-foreground">→ {item.clo}</span>
              </div>
            ))}
          </div>
        )}

        {/* CLO list */}
        {config.cloList.length > 0 && (
          <div className="border-border/50 space-y-1 border-t pt-3">
            <p className="text-muted-foreground text-xs font-medium">Danh sách CLO:</p>
            <div className="flex flex-wrap gap-1.5">
              {config.cloList.map((clo) => (
                <Badge key={clo.maClo} variant="secondary" className="text-[10px]">
                  {clo.maClo} ({clo.trongSoClo || 1}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="border-border/50 flex justify-end border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (window.api?.exportRawGradesTemplate) {
                const res = await window.api.exportRawGradesTemplate(config)
                if (res.ok && res.path) {
                  alert(`Đã xuất file Template điểm thô:\n${res.path}`)
                } else if (res.error) {
                  alert(`Lỗi xuất file: ${res.error}`)
                }
              }
            }}
          >
            <Download className="mr-1 size-3.5" />
            Tải mẫu điểm thô (.xlsx)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
