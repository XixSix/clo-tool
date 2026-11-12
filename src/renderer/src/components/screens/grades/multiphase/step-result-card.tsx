import React from 'react'
import { ChartColumn, FolderOpen, TriangleAlert, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import type { ScreenId } from '@renderer/lib/navigation'
import type { RunResultDto } from '../../../../../../shared/ipc'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 4 — kết quả cuối kỳ và link tới các báo cáo. */
export function StepResultCard({
  result,
  onScreen
}: {
  result: RunResultDto | null
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={4} done={Boolean(result?.ok)} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Kết quả cuối kỳ</CardTitle>
            <CardDescription>Bảng điểm CLO/PLO và phân tích đề thi</CardDescription>
          </div>
          {result?.ok ? <Badge variant="secondary">Đã xuất</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {result?.ok ? (
          <>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <StatBox value={result.studentCount} label="Sinh viên" />
              <StatBox value={`${result.passedPercent}%`} label="Đạt học phần" tone="success" />
              <StatBox value={result.meanCourseScore} label="Điểm TB học phần" />
              <StatBox
                value={result.absentFinalCount + result.missingDataCount}
                label="Vắng thi / thiếu điểm"
                tone="warning"
              />
            </div>

            {!result.runId ? (
              <p className="flex items-start gap-1.5 text-xs text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Không lưu được snapshot chi tiết — màn Sinh viên/Báo cáo sẽ chưa có dữ liệu của lần
                chạy này.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => result.outputDir && window.api.openPath(result.outputDir)}
              >
                <FolderOpen data-icon="inline-start" />
                Mở thư mục báo cáo
              </Button>
              {result.finalReportPath ? (
                <Button size="sm" onClick={() => window.api.openPath(result.finalReportPath!)}>
                  Bảng điểm CLO/PLO
                </Button>
              ) : null}
              {result.examReportPath ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.api.openPath(result.examReportPath!)}
                >
                  Phân tích đề thi
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => onScreen('students')}>
                <Users data-icon="inline-start" />
                Danh sách sinh viên
              </Button>
              <Button variant="outline" size="sm" onClick={() => onScreen('reports')}>
                <ChartColumn data-icon="inline-start" />
                Xem báo cáo
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Sau khi chạy giai đoạn cuối kỳ, bảng điểm đầy đủ (CLO/PLO, điểm học phần) và phân tích
            đề thi sẽ xuất hiện ở đây.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
