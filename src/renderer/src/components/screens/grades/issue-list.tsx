import React from 'react'
import { Badge } from '@renderer/components/ui/badge'
import { cn } from 'cn'
import type { IssueDto } from '../../../../../shared/ipc'

/** Tóm tắt lỗi/cảnh báo đọc file: đếm theo mức + liệt kê tối đa 6 mục. */
export function IssueList({ issues }: { issues: IssueDto[] }): React.ReactElement | null {
  if (issues.length === 0) {
    return <p className="text-xs font-medium text-success">Không có lỗi hay cảnh báo dữ liệu.</p>
  }
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warning').length
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <Badge variant={errors > 0 ? 'destructive' : 'secondary'}>{errors} lỗi</Badge>
        <Badge variant={warnings > 0 ? 'outline' : 'secondary'}>{warnings} cảnh báo</Badge>
      </div>
      <ul className="max-h-40 overflow-auto rounded-lg bg-muted p-2.5 text-xs">
        {issues.slice(0, 6).map((issue, idx) => (
          <li key={`${issue.message}-${idx}`} className="flex gap-1.5 py-0.5">
            <span
              className={cn(
                'size-1.5 shrink-0 translate-y-1.5 rounded-full',
                issue.level === 'error' ? 'bg-destructive' : 'bg-warning'
              )}
            />
            <span className="text-muted-foreground">
              {issue.sheet ? (
                <span className="font-medium text-foreground">
                  [{issue.sheet}
                  {issue.row ? ` dòng ${issue.row}` : ''}]{' '}
                </span>
              ) : null}
              {issue.message}
            </span>
          </li>
        ))}
        {issues.length > 6 ? (
          <li className="py-0.5 text-xs text-muted-foreground/60">
            … và {issues.length - 6} mục khác
          </li>
        ) : null}
      </ul>
    </div>
  )
}
