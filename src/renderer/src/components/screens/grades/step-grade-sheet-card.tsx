import React from 'react'
import { Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import type { GradeSheetSummaryDto } from '../../../../../shared/ipc'
import { FilePick } from '@renderer/components/screens/grades/file-pick'
import { IssueList } from '@renderer/components/screens/grades/issue-list'
import { StepBadge } from '@renderer/components/screens/grades/stepper'
import { StatBox } from '@renderer/components/screens/grades/stat-box'

/** Bước 2 — chọn file bảng điểm và xem nhanh số liệu đọc được. */
export function StepGradeSheetCard({
  gradeSheetPath,
  gradeSheet,
  busy,
  bridgeReady,
  onPick,
  hasConfig
}: {
  gradeSheetPath: string
  gradeSheet: GradeSheetSummaryDto | null
  busy: string | null
  bridgeReady: boolean
  onPick: () => void
  hasConfig: boolean
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <StepBadge number={2} done={Boolean(gradeSheet?.ok)} />
          <div>
            <CardTitle className="text-sm">Bảng điểm sinh viên</CardTitle>
            <CardDescription>Điểm danh + điểm các cột đã khai báo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <FilePick
          label={hasConfig ? 'Chọn file Template_DiemTho.xlsx…' : 'Cần cấu hình môn học trước…'}
          path={gradeSheetPath}
          onClick={onPick}
          disabled={!bridgeReady || Boolean(busy) || !hasConfig}
        />
        {busy === 'grade-sheet' ? (
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" /> Đang đọc bảng điểm…
          </p>
        ) : null}

        {gradeSheet ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <StatBox value={gradeSheet.studentCount} label="sinh viên" />
              <StatBox value={gradeSheet.sessionCount} label="buổi điểm danh" />
              <StatBox value={gradeSheet.absentFinalCount} label="vắng thi CK" tone="warning" />
              <StatBox value={gradeSheet.missingDataCount} label="SV thiếu điểm" tone="warning" />
            </div>
            <IssueList issues={gradeSheet.issues} />
            {gradeSheet.error ? <p className="text-destructive text-xs">{gradeSheet.error}</p> : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
