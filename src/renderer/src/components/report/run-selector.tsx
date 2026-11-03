import React from 'react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { formatDateTime, formatPercent, formatScore } from '@renderer/lib/format'
import type { RunHistoryEntryDto, SessionDto } from '../../../../shared/ipc'

/** Chọn lần chạy đã lưu snapshot chi tiết của môn hiện tại */
export function RunSelector({
  session,
  runId,
  onSelect
}: {
  session: SessionDto
  runId: string
  onSelect: (id: string) => void
}): React.ReactElement {
  const runs = session.history
    .filter((r) => r.runId)
    .slice()
    .reverse()
  const current = runs.find((r) => r.runId === runId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Lần chạy: {current ? formatDateTime(current.ts) : '—'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Chọn lần chạy</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={runId} onValueChange={onSelect}>
          {runs.map((run: RunHistoryEntryDto) => (
            <DropdownMenuRadioItem
              key={run.runId}
              value={run.runId!}
              className="flex-col items-start gap-0.5"
            >
              <span className="text-xs font-medium">{formatDateTime(run.ts)}</span>
              <span className="text-muted-foreground text-xs">
                {run.studentCount} SV · {formatPercent(run.passedPercent)} đạt · TB{' '}
                {formatScore(run.meanCourseScore)}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
