import React from 'react'
import { Badge } from '@renderer/components/ui/badge'
import { cn } from 'cn'
import type { IssueDto } from '../../../../../shared/ipc'

/** Tóm tắt lỗi/cảnh báo đọc file: đếm theo mức + liệt kê tối đa 6 mục. */
export function IssueList({ issues }: { issues: IssueDto[] }): React.ReactElement | null {
  if (issues.length === 0) {
    return <p className="text-success text-xs font-medium">Không có lỗi hay cảnh báo dữ liệu.</p>
  }
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warning').length
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <Badge variant={errors > 0 ? 'destructive' : 'secondary'}>{errors} lỗi</Badge>
        <Badge variant={warnings > 0 ? 'outline' : 'secondary'}>{warnings} cảnh báo</Badge>
      </div>
      <ul className="bg-muted max-h-40 overflow-auto rounded-lg p-2.5 text-xs">
        {issues.slice(0, 6).map((issue, idx) => (
          <li key={`${issue.message}-${idx}`} className="flex gap-1.5 py-0.5">
            <span
              className={cn(
                'size-1.5 shrink-0 translate-y-1.5 rounded-full',
                issue.level === 'error' ? 'bg-destructive' : 'bg-warning'
              )}
            />
            <span className="text-muted-foreground">
              {issue.scope ? (
                <span className="text-foreground font-medium">
                  [{issue.scope}
                  {issue.targetId ? ` ${issue.targetId}` : ''}
                  {issue.row ? ` dòng ${issue.row}` : ''}
                  {issue.column ? ` ${issue.column}` : ''}]{' '}
                </span>
              ) : null}
              {issue.message}
            </span>
          </li>
        ))}
        {issues.length > 6 ? (
          <li className="text-muted-foreground/60 py-0.5 text-xs">
            … và {issues.length - 6} mục khác
          </li>
        ) : null}
      </ul>
    </div>
  )
}
