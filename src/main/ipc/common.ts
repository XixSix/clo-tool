import type { ValidationIssue } from '@core/types'
import type { IssueDto } from '../../shared/ipc'

export function toIssueDto(issue: ValidationIssue): IssueDto {
  return {
    level: issue.level,
    scope: issue.scope,
    targetId: issue.targetId,
    row: issue.row,
    column: issue.column,
    message: issue.message,
    suggestion: issue.suggestion
  }
}

export function hasErrors(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => issue.level === 'error')
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}
