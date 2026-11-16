import { useEffect, useRef, useState } from 'react'
import { validateCourse } from '@core/validator/course'
import { countIssues, hasErrors } from '@core/validator/helpers'
import type { ValidationIssue } from '@core/types/validation'
import { editorConfigToCourse } from '@renderer/components/screens/courses/course-adapter'
import type { EditorConfig } from '@renderer/components/screens/courses/course-editor-types'
import {
  collectEditorIssues,
  dedupeIssues,
  emptyLocatedIssues,
  locateIssues,
  type LocatedIssues
} from '@renderer/lib/course-issue-locator'

export interface CourseMetaValues {
  lop?: string
  giangVien?: string
  namHoc?: string
}

export interface CourseValidationResult extends LocatedIssues {
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
  hasErrors: boolean
  /** Đang trong cửa sổ debounce — chưa nên cho Lưu. */
  pending: boolean
}

interface ValidationState {
  located: LocatedIssues
  issues: ValidationIssue[]
}

/** Chạy đúng bộ rule core trên dữ liệu editor, debounce để không nặng mỗi keystroke. */
export function useCourseValidation(
  editor: EditorConfig,
  meta: CourseMetaValues,
  options?: { debounceMs?: number }
): CourseValidationResult {
  const debounceMs = options?.debounceMs ?? 250
  const [state, setState] = useState<ValidationState>(() => ({
    located: emptyLocatedIssues(),
    issues: []
  }))
  const [pending, setPending] = useState(true)
  const firstRun = useRef(true)

  useEffect(() => {
    const run = (): void => {
      const course = editorConfigToCourse(editor, meta)
      const issues = dedupeIssues([...collectEditorIssues(editor), ...validateCourse(course)])
      setState({ located: locateIssues(issues, editor), issues })
      setPending(false)
    }

    if (firstRun.current) {
      firstRun.current = false
      run()
      return
    }

    setPending(true)
    const timer = setTimeout(run, debounceMs)
    return () => clearTimeout(timer)
  }, [editor, meta, debounceMs])

  const { errors, warnings } = countIssues(state.issues)

  return {
    ...state.located,
    issues: state.issues,
    errorCount: errors,
    warningCount: warnings,
    hasErrors: hasErrors(state.issues),
    pending
  }
}
