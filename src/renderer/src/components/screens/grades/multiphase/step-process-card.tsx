import React from 'react'
import { CheckCircle2, FolderOpen, Loader2, Play, TriangleAlert } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import type { RawSummaryDto, RunResultDto } from '../../../../../../shared/ipc'
import { FilePick, fileName } from '@renderer/components/screens/grades/file-pick'
import { IssueList } from '@renderer/components/screens/grades/issue-list'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 2 — nhập điểm quá trình (CC/GK), xuất báo cáo tạm để duyệt. */
export function StepProcessCard({
  processRawPath,
  processRaw,
  processResult,
  processRunId,
  processReportPath,
  outDir,
  studentCount,
  configPath,
  busy,
  canRun,
  missing,
  bridgeReady,
  onPick,
  onPickOutput,
  onRun
}: {
  processRawPath: string
  processRaw: RawSummaryDto | null
  processResult: RunResultDto | null
  processRunId: string
  processReportPath: string
  outDir: string
  studentCount: number
  configPath: string
  busy: string | null
  canRun: boolean
  missing: string[]
  bridgeReady: boolean
  onPick: () => void
  onPickOutput: () => void
  onRun: () => void
}): React.ReactElement {
  const processReady = Boolean(processRunId)
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={2} done={processReady} />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm">Giai đoạn quá trình</CardTitle>
            <CardDescription>Điểm danh + CC + GK, xuất báo cáo để duyệt</CardDescription>
          </div>
          {processReady ? <Badge variant="secondary">Đã có báo cáo</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FilePick
          label={configPath ? 'Chọn file Template_DiemTho_QuaTrinh.xlsx…' : 'Chọn file Config trước…'}
          path={processRawPath}
          onClick={onPick}
          disabled={!bridgeReady || Boolean(busy) || !configPath}
        />
        {busy === 'process-raw' ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Đang đọc điểm quá trình…
          </p>
        ) : null}

        {processRaw ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <StatBox value={processRaw.studentCount} label="sinh viên" />
              <StatBox value={processRaw.sessionCount} label="buổi điểm danh" />
              <StatBox value={processRaw.missingDataCount} label="SV thiếu điểm" tone="warning" />
              <StatBox value={processRaw.issues.filter((i) => i.level === 'error').length} label="lỗi" />
            </div>
            <IssueList issues={processRaw.issues} />
            {processRaw.error ? <p className="text-xs text-destructive">{processRaw.error}</p> : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={onPickOutput}
            disabled={Boolean(busy)}
            className="min-w-0 justify-start sm:flex-1"
            title={outDir}
          >
            <FolderOpen data-icon="inline-start" />
            <span className="truncate">{outDir || 'Chọn thư mục lưu báo cáo…'}</span>
          </Button>
          <Button onClick={onRun} disabled={!canRun}>
            {busy === 'process-run' ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Đang tính…
              </>
            ) : (
              <>
                <Play data-icon="inline-start" />
                {processReady ? 'Chạy lại quá trình' : 'Tính & xuất báo cáo quá trình'}
              </>
            )}
          </Button>
        </div>

        {!canRun && missing.length > 0 ? (
          <p className="text-xs text-muted-foreground">Còn thiếu: {missing.join(', ')}.</p>
        ) : null}

        {processReady ? (
          <div className="flex flex-col gap-2 rounded-lg bg-success/5 p-3 ring-1 ring-success/30">
            <p className="flex items-center gap-1.5 text-xs font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              Đã lưu kết quả quá trình ({studentCount} sinh viên) — có thể nhập điểm cuối kỳ.
            </p>
            {processReportPath ? (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => window.api.openPath(processReportPath)}
              >
                <FolderOpen data-icon="inline-start" />
                Mở báo cáo quá trình ({fileName(processReportPath)})
              </Button>
            ) : null}
            {processResult?.ok && !processResult.runId ? (
              <p className="flex items-start gap-1.5 text-xs text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Không lưu được snapshot quá trình — cần chạy lại trước khi nhập điểm cuối kỳ.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
