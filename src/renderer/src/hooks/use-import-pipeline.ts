import { useState, useEffect } from 'react'
import { useWorkspace } from '@renderer/hooks/workspace'
import type { RawSummaryDto, RunResultDto, SessionDto } from '../../../shared/ipc'
import type { Course } from '@core/types'
import { normalizeStoredCourse } from '@renderer/components/screens/courses/course-adapter'

export interface ImportStep {
  title: string
  hint: string
  done: boolean
}

export interface ImportPipeline {
  bridgeReady: boolean
  active: SessionDto | null
  courseConfig: Course | null
  rawPath: string
  raw: RawSummaryDto | null
  outDir: string
  result: RunResultDto | null
  busy: string | null
  error: string
  canRun: boolean
  missing: string[]
  steps: ImportStep[]
  activeIndex: number
  pickRaw: () => Promise<void>
  pickOutput: () => Promise<void>
  run: () => Promise<void>
  reset: () => void
}

function loadLocalConfig(sessionId: string): Course | null {
  const key = `course-config-${sessionId}`
  const saved = sessionStorage.getItem(key)
  if (!saved) return null
  try {
    return normalizeStoredCourse(JSON.parse(saved))
  } catch {
    return null
  }
}

/**
 * Toàn bộ state + thao tác của luồng "Nhập điểm": chọn điểm thô → chọn thư mục → chạy.
 * Cấu hình môn học được lưu trữ bền vững qua IPC userData/configs/${sessionId}.json.
 */
export function useImportPipeline(active: SessionDto | null, bridgeReady: boolean): ImportPipeline {
  const { archiveRun, patchSession } = useWorkspace()

  const [loadedConfig, setLoadedConfig] = useState<{
    sessionId: string
    config: Course | null
  } | null>(null)

  useEffect(() => {
    let canceled = false
    if (!active) return

    window.api?.getCourseConfig?.(active.id).then((saved) => {
      if (canceled) return
      const cfg = saved?.config ?? loadLocalConfig(active.id)
      setLoadedConfig({ sessionId: active.id, config: cfg })
    })

    return () => {
      canceled = true
    }
  }, [active])

  const courseConfig = active
    ? loadedConfig?.sessionId === active.id
      ? loadedConfig.config
      : loadLocalConfig(active.id)
    : null

  const [rawPath, setRawPath] = useState(active?.rawPath ?? '')
  const [raw, setRaw] = useState<RawSummaryDto | null>(null)
  const [outDir, setOutDir] = useState(active?.outDir ?? '')
  const [result, setResult] = useState<RunResultDto | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function pickRaw(): Promise<void> {
    if (!courseConfig) {
      setError('Môn học chưa có cấu hình. Hãy vào chi tiết môn để cấu hình CLO/PLO.')
      return
    }
    setError('')
    setBusy('raw')
    try {
      const p = await window.api.pickFile('raw')
      if (!p) return
      setRawPath(p)
      setResult(null)
      setRaw(await window.api.parseRawGrades(courseConfig, p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file điểm.')
    } finally {
      setBusy(null)
    }
  }

  async function pickOutput(): Promise<void> {
    setError('')
    try {
      const p = await window.api.pickDirectory()
      if (p) setOutDir(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không chọn được thư mục.')
    }
  }

  async function run(): Promise<void> {
    if (!courseConfig) {
      setError('Môn học chưa có cấu hình. Hãy vào chi tiết môn để cấu hình CLO/PLO.')
      return
    }
    if (!rawPath || !outDir) {
      setError('Cần chọn đủ: file điểm thô và thư mục lưu báo cáo.')
      return
    }
    setError('')
    setBusy('run')
    setResult(null)
    try {
      const res = await window.api.runPipeline(courseConfig, rawPath, outDir, active?.id)
      setResult(res)
      if (res.ok) {
        archiveRun({
          runId: res.runId,
          ts: Date.now(),
          configPath: active?.configPath || `[In-App] ${courseConfig.maHp}`,
          rawPath,
          outputDir: outDir,
          finalReportPath: res.finalReportPath,
          examReportPath: res.examReportPath,
          studentCount: res.studentCount,
          passedPercent: res.passedPercent,
          meanCourseScore: res.meanCourseScore
        })
        if (active) {
          patchSession(active.id, {
            rawPath,
            outDir,
            cloCount: courseConfig.cloList.length,
            lastOpenedAt: Date.now()
          })
        }
      } else if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tính toán.')
    } finally {
      setBusy(null)
    }
  }

  /** Đặt lại lựa chọn nguồn, giữ thư mục lưu để chạy tiếp */
  function reset(): void {
    if (busy) return
    setError('')
    setRawPath('')
    setRaw(null)
    setResult(null)
  }

  const canRun = Boolean(courseConfig && rawPath && outDir) && !busy && bridgeReady
  const missing = [
    !courseConfig ? 'cấu hình môn học' : null,
    !rawPath ? 'file điểm thô' : null,
    !outDir ? 'thư mục lưu báo cáo' : null
  ].filter((item): item is string => item !== null)

  const steps: ImportStep[] = [
    {
      title: 'Cấu hình môn',
      hint: courseConfig
        ? `${courseConfig.cloList.length} CLO · ${courseConfig.dotDanhGia.length} đầu điểm`
        : 'Chưa cấu hình (vào chi tiết môn)',
      done: Boolean(courseConfig)
    },
    {
      title: 'Điểm thô',
      hint: raw?.ok ? `${raw.studentCount} sinh viên` : 'Chọn file điểm',
      done: Boolean(raw?.ok)
    },
    {
      title: 'Xuất báo cáo',
      hint: result?.ok ? 'Đã xuất xong' : 'Chọn thư mục và chạy',
      done: Boolean(result?.ok)
    }
  ]
  const activeIndex = !courseConfig ? 0 : !raw?.ok ? 1 : 2

  return {
    bridgeReady,
    active,
    courseConfig,
    rawPath,
    raw,
    outDir,
    result,
    busy,
    error,
    canRun,
    missing,
    steps,
    activeIndex,
    pickRaw,
    pickOutput,
    run,
    reset
  }
}
