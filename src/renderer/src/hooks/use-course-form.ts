import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { newSessionId } from '@renderer/hooks/workspace'
import type { SemesterOption } from '@renderer/lib/semester'
import type {
  CourseFormField,
  CourseFormValues
} from '@renderer/lib/course-form-validation'
import type { SessionDto } from '../../../shared/ipc'

export type CourseFormState = CourseFormValues & {
  lop: string
  hocKy: string
  namHoc: string
}

export type CourseFormTouched = Partial<Record<CourseFormField, boolean>>

const EMPTY_FORM: CourseFormState = {
  maHp: '',
  courseName: '',
  soTinChi: '3',
  lop: '',
  hocKy: '',
  namHoc: ''
}

const VALIDATED_FIELDS: CourseFormField[] = ['maHp', 'courseName', 'soTinChi']

/** State + thao tác của hộp thoại "Thêm môn học" (thông tin cơ bản, cấu hình CLO/PLO nhập sau). */
export function useCourseForm(): {
  form: CourseFormState
  setForm: Dispatch<SetStateAction<CourseFormState>>
  hocKyOption: SemesterOption
  setHocKyOption: (option: SemesterOption) => void
  touched: CourseFormTouched
  markTouched: (field: CourseFormField) => void
  field: <K extends keyof CourseFormState>(
    key: K
  ) => {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
  }
  makeSession: () => SessionDto | null
  reset: () => void
} {
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM)
  const [hocKyOption, setHocKyOption] = useState<SemesterOption>('')
  const [touched, setTouched] = useState<CourseFormTouched>({})

  function markTouched(key: CourseFormField): void {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  function field<K extends keyof CourseFormState>(key: K): {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    onBlur: () => void
  } {
    return {
      value: form[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
      onBlur: () => {
        if (VALIDATED_FIELDS.includes(key as CourseFormField)) markTouched(key as CourseFormField)
      }
    }
  }

  /** Dựng SessionDto từ form; trả null nếu thiếu mã học phần hoặc tên môn. */
  function makeSession(): SessionDto | null {
    if (!form.maHp.trim() || !form.courseName.trim()) return null
    const now = Date.now()
    return {
      id: newSessionId(),
      maHp: form.maHp.trim().toUpperCase(),
      courseName: form.courseName.trim(),
      soTinChi: Number(form.soTinChi) || 0,
      lop: form.lop.trim() || undefined,
      hocKy: form.hocKy.trim() || undefined,
      namHoc: form.namHoc.trim() || undefined,
      addedAt: now,
      lastOpenedAt: now,
      history: []
    }
  }

  function reset(): void {
    setForm(EMPTY_FORM)
    setHocKyOption('')
    setTouched({})
  }

  return {
    form,
    setForm,
    hocKyOption,
    setHocKyOption,
    touched,
    markTouched,
    field,
    makeSession,
    reset
  }
}
