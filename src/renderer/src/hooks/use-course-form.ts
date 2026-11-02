import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { hasBridge } from '@renderer/lib/theme'
import { newSessionId } from '@renderer/hooks/workspace'
import { semesterOptionOf, type SemesterOption } from '@renderer/lib/semester'
import type { ConfigSummaryDto, SessionDto } from '../../../shared/ipc'

export interface CourseFormState {
  maHp: string
  courseName: string
  soTinChi: string
  lop: string
  hocKy: string
  namHoc: string
  configPath: string
}

const EMPTY_FORM: CourseFormState = {
  maHp: '',
  courseName: '',
  soTinChi: '3',
  lop: '',
  hocKy: '',
  namHoc: '',
  configPath: ''
}

/** State + thao tác của hộp thoại "Thêm môn học" (điền tay hoặc đọc trước từ file Config). */
export function useCourseForm(): {
  form: CourseFormState
  setForm: Dispatch<SetStateAction<CourseFormState>>
  config: ConfigSummaryDto | null
  hocKyOption: SemesterOption
  setHocKyOption: (option: SemesterOption) => void
  busy: boolean
  error: string
  bridgeReady: boolean
  field: <K extends keyof CourseFormState>(
    key: K
  ) => {
    value: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
  }
  pickConfig: () => Promise<void>
  makeSession: () => SessionDto | null
  reset: () => void
} {
  const bridgeReady = hasBridge()
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM)
  const [config, setConfig] = useState<ConfigSummaryDto | null>(null)
  const [hocKyOption, setHocKyOption] = useState<SemesterOption>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function field<K extends keyof CourseFormState>(
    key: K
  ): { value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void } {
    return {
      value: form[key],
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))
    }
  }

  async function pickConfig(): Promise<void> {
    setError('')
    setBusy(true)
    try {
      const p = await window.api.pickFile('config')
      if (!p) return
      const summary = await window.api.parseConfig(p)
      const importedHocKy = summary.hocKy?.trim() || ''
      const nextHocKy = form.hocKy || importedHocKy
      if (nextHocKy) setHocKyOption(semesterOptionOf(nextHocKy))
      setForm((f) => ({
        ...f,
        configPath: p,
        // Pre-fill từ file Config nếu đang trống
        maHp: f.maHp || summary.maHp || '',
        courseName: f.courseName || summary.courseName || '',
        soTinChi: summary.soTinChi ? String(summary.soTinChi) : f.soTinChi,
        lop: f.lop || summary.lop || '',
        hocKy: nextHocKy,
        namHoc: f.namHoc || summary.namHoc || ''
      }))
      setConfig(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file Config.')
    } finally {
      setBusy(false)
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
      cloCount: config?.ok ? config.cloList.length : undefined,
      configPath: form.configPath || undefined,
      addedAt: now,
      lastOpenedAt: now,
      history: []
    }
  }

  function reset(): void {
    setForm(EMPTY_FORM)
    setConfig(null)
    setHocKyOption('')
    setError('')
  }

  return {
    form,
    setForm,
    config,
    hocKyOption,
    setHocKyOption,
    busy,
    error,
    bridgeReady,
    field,
    pickConfig,
    makeSession,
    reset
  }
}
