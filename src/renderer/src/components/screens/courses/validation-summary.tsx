import React, { useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { cn } from 'cn'
import type { IssueScope, ValidationIssue } from '@core/types/validation'
import type { CourseDetailTab } from '@renderer/components/screens/courses/course-editor-types'

export const SCOPE_LABELS: Record<IssueScope, string> = {
  course_info: 'Thông tin học phần',
  clo: 'CLO',
  assessment: 'Kế hoạch đánh giá',
  exam: 'Đề thi & câu hỏi',
  plo: 'Ma trận PLO',
  integrity: 'Liên kết dữ liệu',
  student: 'Sinh viên',
  grade_sheet: 'Bảng điểm'
}

const SCOPE_ORDER: IssueScope[] = [
  'course_info',
  'clo',
  'assessment',
  'exam',
  'plo',
  'integrity',
  'student',
  'grade_sheet'
]

/** Badge số lỗi/cảnh báo gắn trên tab. */
export function TabIssueBadge({
  errors,
  warnings
}: {
  errors: number
  warnings: number
}): React.ReactElement | null {
  if (errors > 0) {
    return (
      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]" title={`${errors} lỗi`}>
        {errors}
      </Badge>
    )
  }
  if (warnings > 0) {
    return (
      <Badge
        variant="outline"
        className="border-warning/40 text-warning h-4 px-1.5 text-[10px]"
        title={`${warnings} cảnh báo`}
      >
        {warnings}
      </Badge>
    )
  }
  return null
}

/** Danh sách lỗi/cảnh báo nhỏ đặt cạnh một field hoặc một dòng bảng. */
export function IssueLines({
  issues,
  className
}: {
  issues: ValidationIssue[]
  className?: string
}): React.ReactElement | null {
  if (issues.length === 0) return null
  return (
    <ul className={cn('flex flex-col gap-0.5 text-xs', className)}>
      {issues.map((issue, index) => (
        <li
          key={`${issue.level}-${issue.message}-${index}`}
          className={issue.level === 'error' ? 'text-destructive' : 'text-warning'}
        >
          {issue.level === 'error' ? (
            <AlertCircle className="mr-1 inline size-3.5 align-[-2px]" />
          ) : (
            <TriangleAlert className="mr-1 inline size-3.5 align-[-2px]" />
          )}
          {issue.message}
        </li>
      ))}
    </ul>
  )
}

/** Panel tóm tắt tất cả vấn đề của cấu hình, nhóm theo khối nghiệp vụ. */
export function ValidationSummary({
  issues,
  errorCount,
  warningCount,
  hasErrors,
  tabOfIssue,
  onJump
}: {
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
  hasErrors: boolean
  tabOfIssue: Map<ValidationIssue, CourseDetailTab>
  onJump: (tab: CourseDetailTab) => void
}): React.ReactElement | null {
  const [open, setOpen] = useState(false)

  const groups = useMemo(
    () =>
      SCOPE_ORDER.map((scope) => ({
        scope,
        issues: issues.filter((issue) => issue.scope === scope)
      })).filter((group) => group.issues.length > 0),
    [issues]
  )

  if (issues.length === 0) return null

  return (
    <Alert variant={hasErrors ? 'destructive' : 'default'}>
      {hasErrors ? <AlertCircle /> : <TriangleAlert className="text-warning" />}
      <AlertTitle className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {errorCount > 0 ? `${errorCount} lỗi` : 'Không có lỗi'}
          {warningCount > 0 ? ` · ${warningCount} cảnh báo` : ''}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-xs"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Thu gọn' : 'Xem chi tiết'}
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </AlertTitle>
      {open ? (
        <AlertDescription className="mt-1 max-h-64 space-y-2 overflow-auto">
          {groups.map((group) => {
            const tab = tabOfIssue.get(group.issues[0])
            return (
              <div key={group.scope}>
                <button
                  type="button"
                  className="text-foreground text-left text-xs font-semibold underline-offset-2 hover:underline"
                  onClick={() => tab && onJump(tab)}
                >
                  {SCOPE_LABELS[group.scope]} ({group.issues.length})
                </button>
                <ul className="mt-0.5 flex flex-col gap-0.5 pl-3">
                  {group.issues.map((issue, index) => (
                    <li
                      key={`${issue.level}-${issue.targetId ?? ''}-${index}`}
                      className={issue.level === 'error' ? 'text-destructive' : 'text-warning'}
                    >
                      {issue.targetId ? (
                        <span className="font-mono text-[11px]">[{issue.targetId}] </span>
                      ) : null}
                      {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </AlertDescription>
      ) : null}
    </Alert>
  )
}
