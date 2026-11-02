import React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { cn } from 'cn'
import type { ConfigSummaryDto } from '../../../../../shared/ipc'
import { FilePick } from '@renderer/components/screens/grades/file-pick'
import { IssueList } from '@renderer/components/screens/grades/issue-list'
import { StepBadge } from '@renderer/components/screens/grades/stepper'

/** Bước 1 — chọn file Config và xem trước cấu trúc học phần. */
export function StepConfigCard({
  configPath,
  config,
  busy,
  bridgeReady,
  onPick
}: {
  configPath: string
  config: ConfigSummaryDto | null
  busy: string | null
  bridgeReady: boolean
  onPick: () => void
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={1} done={Boolean(config?.ok)} />
          <div>
            <CardTitle className="text-sm">File Config học phần</CardTitle>
            <CardDescription>Cấu trúc CLO, trọng số, câu hỏi, quy tắc</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FilePick
          label="Chọn file Template_Config.xlsx…"
          path={configPath}
          onClick={onPick}
          disabled={!bridgeReady || Boolean(busy)}
        />
        {busy === 'config' ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Đang đọc file Config…
          </p>
        ) : null}

        {config ? (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
            <div className="font-semibold">
              {config.courseName || '(chưa có tên)'}{' '}
              <span className="font-normal text-muted-foreground">— {config.maHp}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {config.soTinChi} tín chỉ · {config.hinhThucThi} · {config.cloList.length} CLO ·{' '}
              {config.planCount} đầu điểm · {config.ploCount} PLO
            </div>
            <div className="flex flex-wrap gap-1.5">
              {config.cloList.map((clo) => (
                <Badge key={clo.code} variant="secondary" title={clo.content}>
                  {clo.code}
                </Badge>
              ))}
            </div>
            <div
              className={cn(
                'text-xs font-medium',
                Math.abs(config.totalWeight - 100) < 0.01 ? 'text-success' : 'text-destructive'
              )}
            >
              Tổng trọng số: {config.totalWeight}%{' '}
              {Math.abs(config.totalWeight - 100) < 0.01 ? '✓' : '(phải bằng 100%)'}
            </div>
            {config.rules ? (
              <div className="text-xs text-muted-foreground">
                Ngưỡng đạt: CLO {config.rules.nguongDatClo} · PLO {config.rules.nguongDatPlo} · HP{' '}
                {config.rules.nguongDatHp} · {config.rules.hpMethod}
              </div>
            ) : null}
            <IssueList issues={config.issues} />
            {config.error ? <p className="text-xs text-destructive">{config.error}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
