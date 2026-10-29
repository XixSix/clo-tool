import React, { useState } from 'react'
import {
  BookOpen,
  ChartColumn,
  Check,
  FolderOpen,
  Loader2,
  Play,
  TriangleAlert,
  Users
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { Button } from '@renderer/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { cn } from 'cn'
import { hasBridge } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/lib/workspace'
import type { ScreenId } from '@renderer/components/app-shell'
import type {
  ConfigSummaryDto,
  IssueDto,
  RawSummaryDto,
  RunResultDto
} from '../../../../shared/ipc'

function fileName(path: string | undefined): string {
  if (!path) return ''
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || path
}

/** Ô số liệu mini dùng chung cho kết quả */
function StatBox({
  value,
  label,
  tone = 'default'
}: {
  value: string | number
  label: string
  tone?: 'default' | 'success' | 'warning'
}): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg p-3 text-center',
        tone === 'success' && 'bg-success/10',
        tone === 'warning' && 'bg-warning/10',
        tone === 'default' && 'bg-muted'
      )}
    >
      <div
        className={cn(
          'text-xl font-bold',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'default' && 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function StepBadge({ number, done }: { number: number; done: boolean }): React.ReactElement {
  return done ? (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
      <Check className="size-3.5" />
    </span>
  ) : (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
      {number}
    </span>
  )
}

/** Thanh tiến trình 3 bước ở đầu màn */
function Stepper({
  steps,
  activeIndex
}: {
  steps: { title: string; hint: string; done: boolean }[]
  activeIndex: number
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      {steps.map((step, index) => (
        <React.Fragment key={step.title}>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                step.done
                  ? 'bg-success text-success-foreground'
                  : index === activeIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step.done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p
                className={cn(
                  'truncate text-xs font-medium',
                  index === activeIndex ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{step.hint}</p>
            </div>
          </div>
          {index < steps.length - 1 ? (
            <span
              className={cn(
                'h-px min-w-4 flex-1',
                step.done ? 'bg-foreground/30' : 'bg-border'
              )}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  )
}

/** Một mục trong checklist "sẵn sàng chạy" */
function ReadyItem({
  ok,
  label,
  value
}: {
  ok: boolean
  label: string
  value: string
}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2 ring-1',
        ok ? 'bg-success/5 ring-success/30' : 'bg-muted ring-border'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
          ok ? 'bg-success text-success-foreground' : 'border border-dashed border-muted-foreground/50'
        )}
      >
        {ok ? <Check className="size-3" /> : null}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={cn('truncate text-xs font-medium', !ok && 'text-muted-foreground')}
          title={value}
        >
          {ok ? value : 'Chưa chọn'}
        </p>
      </div>
    </div>
  )
}

function IssueList({ issues }: { issues: IssueDto[] }): React.ReactElement | null {
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

/** Nút chọn file gốc dùng cho Bước 1 & 2 */
function FilePick({
  label,
  path,
  onClick,
  disabled
}: {
  label: string
  path: string
  onClick: () => void
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full truncate rounded-lg border border-dashed px-3 py-3 text-left text-sm transition',
        disabled && 'cursor-not-allowed opacity-60',
        path
          ? 'border-border bg-muted text-foreground'
          : 'border-border bg-transparent text-muted-foreground',
        !disabled && !path && 'hover:border-primary hover:bg-accent/50'
      )}
      title={path || label}
    >
      {path ? `📄 ${fileName(path)}` : label}
    </button>
  )
}

export function NhapDiem({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const bridgeReady = hasBridge()
  const { active, archiveRun, patchSession } = useWorkspace()

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

  const steps = [
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

  if (!active) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <BookOpen className="text-muted-foreground/40" />
          <EmptyTitle>Chưa chọn môn học</EmptyTitle>
          <EmptyDescription>
            Thêm hoặc chọn một môn học trước khi nhập file Config và file điểm thô.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('courses')}>Thêm môn học</Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="min-w-0 text-[13px]">
          <span className="font-mono font-semibold">{active.maHp}</span>
          <span className="text-muted-foreground">
            {active.lop ? ` · lớp ${active.lop} · ` : ' · '}
            {active.courseName}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0">
            Môn hiện tại
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={Boolean(busy) || (!configPath && !rawPath && !result)}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      <Stepper steps={steps} activeIndex={activeIndex} />

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Đã có lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Bước 1 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <StepBadge number={1} done={Boolean(config?.ok)} />
              <div>
                <CardTitle className="text-sm">File Config học phần</CardTitle>
                <CardDescription>Cấu trúc CLO, trọng số, câu hỏi, quy tắc</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <FilePick
              label="Chọn file Template_Config.xlsx…"
              path={configPath}
              onClick={pickConfig}
              disabled={!bridgeReady || Boolean(busy)}
            />
            {busy === 'config' ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Đang đọc file Config…
              </p>
            ) : null}

            {config ? (
              <div className="flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm">
                <div className="font-semibold">
                  {config.courseName || '(chưa có tên)'}{' '}
                  <span className="font-normal text-muted-foreground">— {config.maHp}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {config.soTinChi} tín chỉ · {config.hinhThucThi} · {config.cloList.length} CLO ·{' '}
                  {config.planCount} đầu điểm · {config.ploCount} PLO
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.cloList.map((clo) => (
                    <Badge key={clo.code} variant="secondary" title={clo.content}>
                      {clo.code}
                    </Badge>
                  ))}
                </div>
                <div
                  className={cn(
                    'text-xs font-medium',
                    Math.abs(config.totalWeight - 100) < 0.01 ? 'text-success' : 'text-destructive'
                  )}
                >
                  Tổng trọng số: {config.totalWeight}%{' '}
                  {Math.abs(config.totalWeight - 100) < 0.01 ? '✓' : '(phải bằng 100%)'}
                </div>
                {config.rules ? (
                  <div className="text-xs text-muted-foreground">
                    Ngưỡng đạt: CLO {config.rules.nguongDatClo} · PLO {config.rules.nguongDatPlo} ·
                    HP {config.rules.nguongDatHp} · {config.rules.hpMethod}
                  </div>
                ) : null}
                <IssueList issues={config.issues} />
                {config.error ? <p className="text-xs text-destructive">{config.error}</p> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Bước 2 */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <StepBadge number={2} done={Boolean(raw?.ok)} />
              <div>
                <CardTitle className="text-sm">File điểm thô</CardTitle>
                <CardDescription>Điểm danh + điểm các cột đã khai báo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <FilePick
              label={configPath ? 'Chọn file Template_DiemTho.xlsx…' : 'Chọn file Config trước…'}
              path={rawPath}
              onClick={pickRaw}
              disabled={!bridgeReady || Boolean(busy) || !configPath}
            />
            {busy === 'raw' ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Đang đọc điểm thô…
              </p>
            ) : null}

            {raw ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <StatBox value={raw.studentCount} label="sinh viên" />
                  <StatBox value={raw.sessionCount} label="buổi điểm danh" />
                  <StatBox value={raw.absentFinalCount} label="vắng thi CK" tone="warning" />
                  <StatBox value={raw.missingDataCount} label="SV thiếu điểm" tone="warning" />
                </div>
                <IssueList issues={raw.issues} />
                {raw.error ? <p className="text-xs text-destructive">{raw.error}</p> : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Bước 3 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <StepBadge number={3} done={Boolean(result?.ok)} />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">Tính toán &amp; xuất báo cáo</CardTitle>
              <CardDescription>
                Sinh 2 file Excel: bảng điểm CLO/PLO và phân tích đề thi
              </CardDescription>
            </div>
            {result?.ok ? <Badge variant="secondary">Đã xuất</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ReadyItem ok={Boolean(configPath)} label="File Config" value={fileName(configPath)} />
            <ReadyItem ok={Boolean(rawPath)} label="File điểm thô" value={fileName(rawPath)} />
            <ReadyItem ok={Boolean(outDir)} label="Thư mục lưu" value={fileName(outDir)} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={pickOutput}
              disabled={Boolean(busy)}
              className="min-w-0 justify-start sm:flex-1"
              title={outDir}
            >
              <FolderOpen data-icon="inline-start" />
              <span className="truncate">
                {outDir ? outDir : 'Chọn thư mục lưu báo cáo…'}
              </span>
            </Button>
            <Button onClick={run} disabled={!canRun} size="lg">
              {busy === 'run' ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Đang tính &amp; xuất…
                </>
              ) : (
                <>
                  <Play data-icon="inline-start" />
                  {result?.ok ? 'Chạy lại' : 'Tính toán & xuất báo cáo'}
                </>
              )}
            </Button>
          </div>

          {!canRun && missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">Còn thiếu: {missing.join(', ')}.</p>
          ) : null}

          {result?.ok ? (
            <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 ring-1 ring-foreground/10">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatBox value={result.studentCount} label="Sinh viên" />
                <StatBox value={`${result.passedPercent}%`} label="Đạt học phần" tone="success" />
                <StatBox value={result.meanCourseScore} label="Điểm TB học phần" />
                <StatBox
                  value={result.absentFinalCount + result.missingDataCount}
                  label="Vắng thi / thiếu điểm"
                  tone="warning"
                />
              </div>

              {!result.runId ? (
                <p className="flex items-start gap-1.5 text-xs text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  Không lưu được snapshot chi tiết — màn Sinh viên/Báo cáo sẽ chưa có dữ liệu của
                  lần chạy này.
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => result.outputDir && window.api.openPath(result.outputDir)}
                >
                  <FolderOpen data-icon="inline-start" />
                  Mở thư mục báo cáo
                </Button>
                {result.finalReportPath ? (
                  <Button size="sm" onClick={() => window.api.openPath(result.finalReportPath!)}>
                    Bảng điểm CLO/PLO
                  </Button>
                ) : null}
                {result.examReportPath ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.api.openPath(result.examReportPath!)}
                  >
                    Phân tích đề thi
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => onScreen('students')}>
                  <Users data-icon="inline-start" />
                  Danh sách sinh viên
                </Button>
                <Button variant="outline" size="sm" onClick={() => onScreen('reports')}>
                  <ChartColumn data-icon="inline-start" />
                  Xem báo cáo
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sau khi chạy, phần biểu đồ CLO/PLO và phân tích đề thi chi tiết nằm ở màn Báo cáo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
