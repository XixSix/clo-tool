import React from 'react'
import { Loader2, Play } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import type { RawSummaryDto } from '../../../../../../shared/ipc'
import { FilePick } from '@renderer/components/screens/grades/file-pick'
import { IssueList } from '@renderer/components/screens/grades/issue-list'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 3 — nhập điểm cuối kỳ (CK + Mã đề) rồi tính lại toàn bộ. */
export function StepFinalCard({
  finalRawPath,
  finalRaw,
  processReady,
  configPath,
  busy,
  canRun,
  missing,
  bridgeReady,
  onPick,
  onRun
}: {
  finalRawPath: string
  finalRaw: RawSummaryDto | null
  processReady: boolean
  configPath: string
  busy: string | null
  canRun: boolean
  missing: string[]
  bridgeReady: boolean
  onPick: () => void
  onRun: () => void
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={3} done={Boolean(finalRaw?.ok)} />
          <div>
            <CardTitle className="text-sm">Giai đoạn cuối kỳ</CardTitle>
            <CardDescription>Điểm CK + Mã đề, ghép theo Mã SV</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FilePick
          label={
            !configPath
              ? 'Chọn file Config trước…'
              : !processReady
                ? 'Chạy xong giai đoạn quá trình trước…'
                : 'Chọn file Template_DiemTho_CuoiKy.xlsx…'
          }
          path={finalRawPath}
          onClick={onPick}
          disabled={!bridgeReady || Boolean(busy) || !configPath || !processReady}
        />
        {busy === 'final-raw' ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Đang đọc điểm cuối kỳ…
          </p>
        ) : null}

        {finalRaw ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <StatBox value={finalRaw.studentCount} label="sinh viên" />
              <StatBox value={finalRaw.absentFinalCount} label="vắng thi CK" tone="warning" />
              <StatBox value={finalRaw.missingDataCount} label="SV thiếu điểm" tone="warning" />
              <StatBox value={finalRaw.issues.filter((i) => i.level === 'error').length} label="lỗi" />
            </div>
            <IssueList issues={finalRaw.issues} />
            {finalRaw.error ? <p className="text-xs text-destructive">{finalRaw.error}</p> : null}
          </div>
        ) : null}

        <Button onClick={onRun} disabled={!canRun} size="lg" className="self-start">
          {busy === 'final-run' ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Đang ghép &amp; tính…
            </>
          ) : (
            <>
              <Play data-icon="inline-start" />
              Tính &amp; xuất báo cáo cuối kỳ
            </>
          )}
        </Button>

        {!canRun && missing.length > 0 ? (
          <p className="text-xs text-muted-foreground">Còn thiếu: {missing.join(', ')}.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
