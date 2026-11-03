import React from 'react'
import { ChartColumn, FolderOpen, Loader2, Play, TriangleAlert, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import type { ScreenId } from '@renderer/lib/navigation'
import type { RunResultDto } from '../../../../../shared/ipc'
import { fileName } from '@renderer/components/screens/grades/file-pick'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { ReadyItem, StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 3 — kiểm tra đủ nguồn, chọn thư mục và chạy tính toán. */
export function StepRunCard({
  outDir,
  result,
  busy,
  canRun,
  missing,
  onPickOutput,
  onRun,
  onScreen
}: {
  outDir: string
  result: RunResultDto | null
  busy: string | null
  canRun: boolean
  missing: string[]
  onPickOutput: () => void
  onRun: () => void
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={3} done={Boolean(result?.ok)} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Tính toán & xuất báo cáo</CardTitle>
            <CardDescription>
              Sinh 2 file Excel: bảng điểm CLO/PLO và phân tích đề thi
            </CardDescription>
          </div>
          {result?.ok ? <Badge variant="secondary">Đã xuất</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ReadyItem ok={true} label="Cấu hình môn" value="Đã nhập trong ứng dụng" />
          <ReadyItem ok={Boolean(outDir)} label="Thư mục lưu" value={fileName(outDir)} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={onPickOutput}
            disabled={Boolean(busy)}
            className="min-w-0 justify-start sm:flex-1"
            title={outDir}
          >
            <FolderOpen data-icon="inline-start" />
            <span className="truncate">{outDir ? outDir : 'Chọn thư mục lưu báo cáo…'}</span>
          </Button>
          <Button onClick={onRun} disabled={!canRun} size="lg">
            {busy === 'run' ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Đang tính & xuất…
              </>
            ) : (
              <>
                <Play data-icon="inline-start" />
                {result?.ok ? 'Chạy lại' : 'Tính toán & xuất báo cáo'}
              </>
            )}
          </Button>
        </div>

        {!canRun && missing.length > 0 ? (
          <p className="text-muted-foreground text-xs">Còn thiếu: {missing.join(', ')}.</p>
        ) : null}

        {result?.ok ? (
          <div className="bg-muted/50 ring-foreground/10 flex flex-col gap-3 rounded-xl p-3 ring-1">
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
              <p className="text-warning flex items-start gap-1.5 text-xs">
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
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            Sau khi chạy, phần biểu đồ CLO/PLO và phân tích đề thi chi tiết nằm ở màn Báo cáo.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
