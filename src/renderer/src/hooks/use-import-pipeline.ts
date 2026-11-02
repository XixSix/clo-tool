import { useState } from 'react'
import { useWorkspace } from '@renderer/hooks/workspace'
import type {
  ConfigSummaryDto,
  RawSummaryDto,
  RunResultDto,
  SessionDto
} from '../../../shared/ipc'

export interface ImportStep {
  title: string
  hint: string
  done: boolean
}

export interface ImportPipeline {
  bridgeReady: boolean
  active: SessionDto | null
  configPath: string
  config: ConfigSummaryDto | null
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
  pickConfig: () => Promise<void>
  pickRaw: () => Promise<void>
  pickOutput: () => Promise<void>
  run: () => Promise<void>
  reset: () => void
}

/**
 * Toàn bộ state + thao tác của luồng "Nhập điểm": chọn Config → chọn điểm thô → chọn thư mục → chạy.
 * Tách khỏi component để phần render chỉ còn bố cục.
 */
export function useImportPipeline(
  active: SessionDto | null,
  bridgeReady: boolean
): ImportPipeline {
  const { archiveRun, patchSession } = useWorkspace()

  // Prefill từ môn hiện tại — component được remount qua key khi đổi môn
  const [configPath, setConfigPath] = useState(active?.configPath ?? '')
  const [config, setConfig] = useState<ConfigSummaryDto | null>(null)
  const [rawPath, setRawPath] = useState(active?.rawPath ?? '')
  const [raw, setRaw] = useState<RawSummaryDto | null>(null)
  const [outDir, setOutDir] = useState(active?.outDir ?? '')
  const [result, setResult] = useState<RunResultDto | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function pickConfig(): Promise<void> {
    setError('')
    setBusy('config')
    try {
      const p = await window.api.pickFile('config')
      if (!p) return
      setConfigPath(p)
      setRaw(null)
      setRawPath('')
      setResult(null)
      setConfig(await window.api.parseConfig(p))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file Config.')
    } finally {
      setBusy(null)
    }
  }

  async function pickRaw(): Promise<void> {
    if (!configPath) {
      setError('Hãy chọn file Config trước.')
      return
    }
    setError('')
    setBusy('raw')
    try {
      const p = await window.api.pickFile('raw')
      if (!p) return
      setRawPath(p)
      setResult(null)
      setRaw(await window.api.parseRawGrades(configPath, p))
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
    if (!configPath || !rawPath || !outDir) {
      setError('Cần chọn đủ: file Config, file điểm thô và thư mục lưu báo cáo.')
      return
    }
    setError('')
    setBusy('run')
    setResult(null)
    try {
      const res = await window.api.runPipeline(configPath, rawPath, outDir, active?.id)
      setResult(res)
      if (res.ok) {
        archiveRun({
          runId: res.runId,
          ts: Date.now(),
          configPath,
          rawPath,
          outputDir: outDir,
          finalReportPath: res.finalReportPath,
          examReportPath: res.examReportPath,
          studentCount: res.studentCount,
          passedPercent: res.passedPercent,
          meanCourseScore: res.meanCourseScore
        })
        // Ghi nhớ đường dẫn để lần sau mở màn là có sẵn
        if (active) {
          patchSession(active.id, {
            configPath,
            rawPath,
            outDir,
            cloCount: config?.ok ? config.cloList.length : active.cloCount,
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
    setConfigPath('')
    setConfig(null)
    setRawPath('')
    setRaw(null)
    setResult(null)
  }

  const canRun = Boolean(configPath && rawPath && outDir) && !busy && bridgeReady
  const missing = [
    !configPath ? 'file Config' : null,
    !rawPath ? 'file điểm thô' : null,
    !outDir ? 'thư mục lưu báo cáo' : null
  ].filter((item): item is string => item !== null)

  const steps: ImportStep[] = [
    {
      title: 'File Config',
      hint: config?.ok ? `${config.maHp} · ${config.cloList.length} CLO` : 'Chọn cấu trúc học phần',
      done: Boolean(config?.ok)
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
  const activeIndex = !config?.ok ? 0 : !raw?.ok ? 1 : 2

  return {
    bridgeReady,
    active,
    configPath,
    config,
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
    pickConfig,
    pickRaw,
    pickOutput,
    run,
    reset
  }
}
