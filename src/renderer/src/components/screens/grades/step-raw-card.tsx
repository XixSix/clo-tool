import React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import type { RawSummaryDto } from '../../../../../shared/ipc'
import { FilePick } from '@renderer/components/screens/grades/file-pick'
import { IssueList } from '@renderer/components/screens/grades/issue-list'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 2 — chọn file điểm thô và xem nhanh số liệu đọc được. */
export function StepRawCard({
  rawPath,
  raw,
  configPath,
  busy,
  bridgeReady,
  onPick
}: {
  rawPath: string
  raw: RawSummaryDto | null
  configPath: string
  busy: string | null
  bridgeReady: boolean
  onPick: () => void
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={2} done={Boolean(raw?.ok)} />
          <div>
            <CardTitle className="text-sm">File điểm thô</CardTitle>
            <CardDescription>Điểm danh + điểm các cột đã khai báo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FilePick
          label={configPath ? 'Chọn file Template_DiemTho.xlsx…' : 'Chọn file Config trước…'}
          path={rawPath}
          onClick={onPick}
          disabled={!bridgeReady || Boolean(busy) || !configPath}
        />
        {busy === 'raw' ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Đang đọc điểm thô…
          </p>
        ) : null}

        {raw ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <StatBox value={raw.studentCount} label="sinh viên" />
              <StatBox value={raw.sessionCount} label="buổi điểm danh" />
              <StatBox value={raw.absentFinalCount} label="vắng thi CK" tone="warning" />
              <StatBox value={raw.missingDataCount} label="SV thiếu điểm" tone="warning" />
            </div>
            <IssueList issues={raw.issues} />
            {raw.error ? <p className="text-xs text-destructive">{raw.error}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
