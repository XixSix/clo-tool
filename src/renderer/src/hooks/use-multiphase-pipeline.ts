import { useEffect, useState } from 'react'
import { useWorkspace } from '@renderer/hooks/workspace'
import type { ImportStep } from '@renderer/hooks/use-import-pipeline'
import type {
  ConfigSummaryDto,
  RawSummaryDto,
  RunResultDto,
  SessionDto
} from '../../../shared/ipc'

interface ProcessSnapshotInfo {
  runId: string
  studentCount: number
  ts: number
}

export interface MultiphasePipeline {
  bridgeReady: boolean
  active: SessionDto | null
  configPath: string
  config: ConfigSummaryDto | null
  processRawPath: string
  processRaw: RawSummaryDto | null
  finalRawPath: string
  finalRaw: RawSummaryDto | null
  outDir: string
  processResult: RunResultDto | null
  result: RunResultDto | null
  processRunId: string
  processReportPath: string
  processSnapshot: ProcessSnapshotInfo | null
  busy: string | null
  error: string
  canRunProcess: boolean
  canRunFinal: boolean
  missingProcess: string[]
  missingFinal: string[]
  steps: ImportStep[]
  activeIndex: number
  pickConfig: () => Promise<void>
  pickProcessRaw: () => Promise<void>
  pickFinalRaw: () => Promise<void>
  pickOutput: () => Promise<void>
  runProcess: () => Promise<void>
  runFinal: () => Promise<void>
  reset: () => void
}

/**
 * Luồng nhập điểm 2 giai đoạn: Config → Quá trình (CC/GK) → Cuối kỳ (CK) → Kết quả.
 *
 * Giai đoạn quá trình lưu một snapshot ở main process; giai đoạn cuối kỳ đọc lại
 * snapshot đó, ghép theo Mã SV rồi tính toàn bộ. `processRunId` lấy từ session để
 * có thể chạy tiếp sau khi đóng/mở app.
 */
export function useMultiphasePipeline(
  active: SessionDto | null,
  bridgeReady: boolean
): MultiphasePipeline {
  const { archiveRun, patchSession } = useWorkspace()

  const [configPath, setConfigPath] = useState(active?.configPath ?? '')
  const [config, setConfig] = useState<ConfigSummaryDto | null>(null)
  const [processRawPath, setProcessRawPath] = useState('')
  const [processRaw, setProcessRaw] = useState<RawSummaryDto | null>(null)
  const [finalRawPath, setFinalRawPath] = useState('')
  const [finalRaw, setFinalRaw] = useState<RawSummaryDto | null>(null)
  const [outDir, setOutDir] = useState(active?.outDir ?? '')
  const [processResult, setProcessResult] = useState<RunResultDto | null>(null)
  const [result, setResult] = useState<RunResultDto | null>(null)
  const [localProcessRunId, setLocalProcessRunId] = useState('')
  const [loadedSnapshot, setLoadedSnapshot] = useState<ProcessSnapshotInfo | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const savedProcessRunId = active?.processRunId ?? ''
  const processRunId = savedProcessRunId || localProcessRunId
  const processSnapshot =
    loadedSnapshot && loadedSnapshot.runId === savedProcessRunId ? loadedSnapshot : null

  // Khôi phục thông tin giai đoạn quá trình đã chạy trước khi đóng app.
  useEffect(() => {
    if (!savedProcessRunId) return
    let alive = true
    window.api
      .getRunSnapshot(savedProcessRunId)
      .then((snapshot) => {
        if (!alive) return
        setLoadedSnapshot(
          snapshot?.phase === 'process'
            ? {
                runId: savedProcessRunId,
                studentCount: snapshot.summary.totalStudents,
                ts: snapshot.ts
              }
            : null
        )
      })
      .catch(() => {
        if (alive) setLoadedSnapshot(null)
      })
    return () => {
      alive = false
    }
  }, [savedProcessRunId])

  async function pickConfig(): Promise<void> {
    setError('')
    setBusy('config')
    try {
      const p = await window.api.pickFile('config')
      if (!p) return
      setConfigPath(p)
      setConfig(await window.api.parseConfig(p))
      // Đổi Config ⇒ dữ liệu quá trình cũ không còn chắc chắn khớp.
      setProcessRawPath('')
      setProcessRaw(null)
      setFinalRawPath('')
      setFinalRaw(null)
      setProcessResult(null)
      setResult(null)
      setLocalProcessRunId('')
      if (active) {
        patchSession(active.id, {
          configPath: p,
          processRunId: undefined,
          processReportPath: undefined
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file Config.')
    } finally {
      setBusy(null)
    }
  }

  async function pickProcessRaw(): Promise<void> {
    if (!configPath) {
      setError('Hãy chọn file Config trước.')
      return
    }
    setError('')
    setBusy('process-raw')
    try {
      const p = await window.api.pickFile('raw')
      if (!p) return
      setProcessRawPath(p)
      setProcessResult(null)
      setResult(null)
      setProcessRaw(await window.api.parseRawGrades(configPath, p, 'process'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file điểm quá trình.')
    } finally {
      setBusy(null)
    }
  }

  async function pickFinalRaw(): Promise<void> {
    if (!configPath) {
      setError('Hãy chọn file Config trước.')
      return
    }
    setError('')
    setBusy('final-raw')
    try {
      const p = await window.api.pickFile('raw')
      if (!p) return
      setFinalRawPath(p)
      setResult(null)
      setFinalRaw(await window.api.parseRawGrades(configPath, p, 'final'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file điểm cuối kỳ.')
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

  async function runProcess(): Promise<void> {
    if (!configPath || !processRawPath || !outDir) {
      setError('Cần chọn đủ: file Config, file điểm quá trình và thư mục lưu báo cáo.')
      return
    }
    setError('')
    setBusy('process-run')
    setProcessResult(null)
    setResult(null)
    try {
      const res = await window.api.runProcess(configPath, processRawPath, outDir, active?.id)
      setProcessResult(res)
      if (res.ok) {
        if (res.runId) setLocalProcessRunId(res.runId)
        if (active) {
          patchSession(active.id, {
            configPath,
            rawPath: processRawPath,
            outDir,
            processRunId: res.runId,
            processReportPath: res.processReportPath,
            cloCount: config?.ok ? config.cloList.length : active.cloCount,
            lastOpenedAt: Date.now()
          })
        }
      } else if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tính điểm quá trình.')
    } finally {
      setBusy(null)
    }
  }

  async function runFinal(): Promise<void> {
    if (!configPath || !finalRawPath || !outDir || !processRunId) {
      setError(
        'Cần chọn đủ: file Config, file điểm cuối kỳ, thư mục lưu và chạy xong giai đoạn quá trình.'
      )
      return
    }
    setError('')
    setBusy('final-run')
    setResult(null)
    try {
      const res = await window.api.runFinal(
        configPath,
        finalRawPath,
        outDir,
        processRunId,
        active?.id
      )
      setResult(res)
      if (res.ok) {
        archiveRun({
          runId: res.runId,
          ts: Date.now(),
          configPath,
          rawPath: finalRawPath,
          outputDir: outDir,
          finalReportPath: res.finalReportPath,
          examReportPath: res.examReportPath,
          studentCount: res.studentCount,
          passedPercent: res.passedPercent,
          meanCourseScore: res.meanCourseScore
        })
        if (active) {
          patchSession(active.id, {
            configPath,
            rawPath: finalRawPath,
            outDir,
            processRunId,
            processReportPath: active.processReportPath,
            cloCount: config?.ok ? config.cloList.length : active.cloCount,
            lastOpenedAt: Date.now()
          })
        }
      } else if (res.error) {
        setError(res.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tính điểm cuối kỳ.')
    } finally {
      setBusy(null)
    }
  }

  /** Đặt lại toàn bộ lựa chọn của 2 giai đoạn, giữ thư mục lưu. */
  function reset(): void {
    if (busy) return
    setError('')
    setConfigPath('')
    setConfig(null)
    setProcessRawPath('')
    setProcessRaw(null)
    setFinalRawPath('')
    setFinalRaw(null)
    setProcessResult(null)
    setResult(null)
    setLocalProcessRunId('')
    setLoadedSnapshot(null)
    if (active) {
      patchSession(active.id, {
        configPath: undefined,
        rawPath: undefined,
        processRunId: undefined,
        processReportPath: undefined
      })
    }
  }

  const processReady = Boolean(processRunId)
  const canRunProcess =
    Boolean(configPath && processRawPath && outDir) && !busy && bridgeReady
  const canRunFinal =
    Boolean(configPath && finalRawPath && outDir && processRunId) && !busy && bridgeReady

  const missingProcess = [
    !configPath ? 'file Config' : null,
    !processRawPath ? 'file điểm quá trình' : null,
    !outDir ? 'thư mục lưu báo cáo' : null
  ].filter((item): item is string => item !== null)
  const missingFinal = [
    !configPath ? 'file Config' : null,
    !processReady ? 'kết quả giai đoạn quá trình' : null,
    !finalRawPath ? 'file điểm cuối kỳ' : null,
    !outDir ? 'thư mục lưu báo cáo' : null
  ].filter((item): item is string => item !== null)

  const processStudentCount =
    processResult?.studentCount ?? processSnapshot?.studentCount ?? 0

  const steps: ImportStep[] = [
    {
      title: 'File Config',
      hint: config?.ok ? `${config.maHp} · ${config.cloList.length} CLO` : 'Chọn cấu trúc học phần',
      done: Boolean(config?.ok)
    },
    {
      title: 'Quá trình',
      hint: processReady ? `${processStudentCount} sinh viên` : 'Nhập CC/GK và xuất báo cáo',
      done: processReady
    },
    {
      title: 'Cuối kỳ',
      hint: finalRaw?.ok ? `${finalRaw.studentCount} sinh viên` : 'Nhập CK + Mã đề',
      done: Boolean(finalRaw?.ok)
    },
    {
      title: 'Kết quả',
      hint: result?.ok ? 'Đã xuất báo cáo' : 'Bảng điểm CLO/PLO',
      done: Boolean(result?.ok)
    }
  ]
  const activeIndex = !config?.ok ? 0 : !processReady ? 1 : !finalRaw?.ok ? 2 : 3

  return {
    bridgeReady,
    active,
    configPath,
    config,
    processRawPath,
    processRaw,
    finalRawPath,
    finalRaw,
    outDir,
    processResult,
    result,
    processRunId,
    processReportPath: active?.processReportPath ?? processResult?.processReportPath ?? '',
    processSnapshot,
    busy,
    error,
    canRunProcess,
    canRunFinal,
    missingProcess,
    missingFinal,
    steps,
    activeIndex,
    pickConfig,
    pickProcessRaw,
    pickFinalRaw,
    pickOutput,
    runProcess,
    runFinal,
    reset
  }
}
