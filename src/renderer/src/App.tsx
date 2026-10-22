import React, { useState } from 'react'
import type {
  ConfigSummaryDto,
  IssueDto,
  RawSummaryDto,
  RunResultDto
} from '../../shared/ipc'

function hasBridge(): boolean {
  return typeof window !== 'undefined' && 'api' in window
}

function fileName(path: string): string {
  const parts = path.split(/[\\/]/)
  return parts[parts.length - 1] || path
}

function IssueList({ issues, limit = 6 }: { issues: IssueDto[]; limit?: number }): React.ReactElement {
  if (issues.length === 0) {
    return <p className="text-sm text-emerald-600">Không có lỗi hay cảnh báo dữ liệu.</p>
  }
  const errors = issues.filter((i) => i.level === 'error')
  const warnings = issues.filter((i) => i.level === 'warning')
  const shown = [...errors, ...warnings].slice(0, limit)

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className={errors.length > 0 ? 'text-red-600' : 'text-slate-400'}>
          {errors.length} lỗi
        </span>
        <span className="text-slate-300">•</span>
        <span className={warnings.length > 0 ? 'text-amber-600' : 'text-slate-400'}>
          {warnings.length} cảnh báo
        </span>
      </div>
      <ul className="max-h-40 space-y-1 overflow-auto rounded-md bg-slate-50 p-2 text-xs">
        {shown.map((issue, idx) => (
          <li key={`${issue.message}-${idx}`} className="flex gap-1.5">
            <span className={issue.level === 'error' ? 'text-red-500' : 'text-amber-500'}>
              {issue.level === 'error' ? '●' : '○'}
            </span>
            <span className="text-slate-600">
              {issue.sheet ? (
                <span className="mr-1 font-medium text-slate-700">
                  [{issue.sheet}
                  {issue.row ? ` dòng ${issue.row}` : ''}]
                </span>
              ) : null}
              {issue.message}
            </span>
          </li>
        ))}
        {issues.length > shown.length ? (
          <li className="text-slate-400">… và {issues.length - shown.length} mục khác</li>
        ) : null}
      </ul>
    </div>
  )
}

function StepBadge({ number, done }: { number: number; done: boolean }): React.ReactElement {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {done ? '✓' : number}
    </span>
  )
}

export default function App(): React.ReactElement {
  const [configPath, setConfigPath] = useState('')
  const [config, setConfig] = useState<ConfigSummaryDto | null>(null)
  const [rawPath, setRawPath] = useState('')
  const [raw, setRaw] = useState<RawSummaryDto | null>(null)
  const [outDir, setOutDir] = useState('')
  const [result, setResult] = useState<RunResultDto | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const bridgeReady = hasBridge()

  async function pickConfig(): Promise<void> {
    setError('')
    try {
      const path = await window.api.pickFile('config')
      if (!path) return
      setBusy('config')
      setConfigPath(path)
      setConfig(null)
      setRaw(null)
      setRawPath('')
      setResult(null)
      setConfig(await window.api.parseConfig(path))
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
    try {
      const path = await window.api.pickFile('raw')
      if (!path) return
      setBusy('raw')
      setRawPath(path)
      setRaw(null)
      setResult(null)
      setRaw(await window.api.parseRawGrades(configPath, path))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file điểm.')
    } finally {
      setBusy(null)
    }
  }

  async function pickOutput(): Promise<void> {
    setError('')
    try {
      const path = await window.api.pickDirectory()
      if (path) setOutDir(path)
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
      const res = await window.api.runPipeline(configPath, rawPath, outDir)
      setResult(res)
      if (!res.ok && res.error) setError(res.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tính toán.')
    } finally {
      setBusy(null)
    }
  }

  async function createSamples(): Promise<void> {
    setError('')
    try {
      const dir = await window.api.pickDirectory()
      if (!dir) return
      setBusy('samples')
      const created = await window.api.createSamples(dir)
      if (!created.ok || !created.configPath || !created.rawPath) {
        setError(created.error ?? 'Không tạo được file mẫu.')
        return
      }
      setConfigPath(created.configPath)
      setRawPath(created.rawPath)
      setOutDir(created.dir)
      setConfig(await window.api.parseConfig(created.configPath))
      setRaw(await window.api.parseRawGrades(created.configPath, created.rawPath))
      setResult(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được file mẫu.')
    } finally {
      setBusy(null)
    }
  }

  const canRun = Boolean(configPath && rawPath && outDir) && !busy

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 text-white shadow">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl font-bold ring-1 ring-white/30">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                CLO/PLO Evaluator — Đại học Thành Đông
              </h1>
              <p className="text-xs text-blue-100">
                Đo lường &amp; đánh giá chuẩn đầu ra học phần theo QĐ 450/QĐ-ĐHTĐ (07/8/2024)
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 sm:block">
            Offline 100% · Dữ liệu mẫu
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 p-6">
        {!bridgeReady ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Chế độ Web Preview: các nút chọn file chỉ hoạt động khi chạy app Electron
            (<code className="rounded bg-amber-100 px-1">npm run dev</code>).
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* Bắt đầu nhanh */}
        <section className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-blue-900">Chưa có dữ liệu để thử?</h2>
            <p className="text-xs text-blue-700">
              Tạo ngay bộ file mẫu KTLT101 (32 sinh viên, 12 buổi điểm danh, đủ 3 CLO) vào một thư
              mục bạn chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={createSamples}
            disabled={!bridgeReady || Boolean(busy)}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === 'samples' ? 'Đang tạo…' : 'Tạo bộ file mẫu'}
          </button>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Bước 1 */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <StepBadge number={1} done={Boolean(config?.ok)} />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">File Config học phần</h2>
                <p className="text-xs text-slate-500">Cấu trúc CLO, trọng số, câu hỏi, quy tắc</p>
              </div>
            </div>

            <button
              type="button"
              onClick={pickConfig}
              disabled={!bridgeReady || Boolean(busy)}
              className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {configPath ? (
                <span className="block truncate font-medium text-slate-800" title={configPath}>
                  📄 {fileName(configPath)}
                </span>
              ) : (
                'Chọn file Template_Config.xlsx…'
              )}
            </button>

            {busy === 'config' ? (
              <p className="mt-2 text-xs text-blue-600">Đang đọc file Config…</p>
            ) : null}

            {config ? (
              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="font-semibold text-slate-800">
                    {config.courseName || '(chưa có tên)'}{' '}
                    <span className="font-normal text-slate-500">— {config.maHp}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {config.soTinChi} tín chỉ · {config.hinhThucThi} · {config.cloList.length} CLO ·{' '}
                    {config.planCount} đầu điểm · {config.ploCount} PLO
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {config.cloList.map((clo) => (
                      <span
                        key={clo.code}
                        title={clo.content}
                        className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {clo.code}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      Math.abs(config.totalWeight - 100) < 0.01
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    Tổng trọng số: {config.totalWeight}%{' '}
                    {Math.abs(config.totalWeight - 100) < 0.01 ? '✓' : '(phải bằng 100%)'}
                  </div>
                  {config.rules ? (
                    <div className="mt-1 text-xs text-slate-500">
                      Ngưỡng đạt: CLO {config.rules.nguongDatClo} · PLO {config.rules.nguongDatPlo}{' '}
                      · HP {config.rules.nguongDatHp} · {config.rules.hpMethod}
                    </div>
                  ) : null}
                </div>
                <IssueList issues={config.issues} />
                {config.error ? (
                  <p className="text-xs text-red-600">{config.error}</p>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Bước 2 */}
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <StepBadge number={2} done={Boolean(raw?.ok)} />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">File điểm thô</h2>
                <p className="text-xs text-slate-500">Điểm danh + điểm các cột đã khai báo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={pickRaw}
              disabled={!bridgeReady || Boolean(busy) || !configPath}
              className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-left text-sm text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rawPath ? (
                <span className="block truncate font-medium text-slate-800" title={rawPath}>
                  📄 {fileName(rawPath)}
                </span>
              ) : (
                'Chọn file Template_DiemTho.xlsx…'
              )}
            </button>

            {busy === 'raw' ? (
              <p className="mt-2 text-xs text-blue-600">Đang đọc điểm thô…</p>
            ) : null}

            {raw ? (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-lg font-bold text-slate-800">{raw.studentCount}</div>
                    <div className="text-xs text-slate-500">sinh viên</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <div className="text-lg font-bold text-slate-800">{raw.sessionCount}</div>
                    <div className="text-xs text-slate-500">buổi điểm danh</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <div className="text-lg font-bold text-amber-700">{raw.absentFinalCount}</div>
                    <div className="text-xs text-amber-600">vắng thi CK</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <div className="text-lg font-bold text-amber-700">{raw.missingDataCount}</div>
                    <div className="text-xs text-amber-600">SV thiếu điểm</div>
                  </div>
                </div>
                <IssueList issues={raw.issues} />
                {raw.error ? <p className="text-xs text-red-600">{raw.error}</p> : null}
              </div>
            ) : null}
          </section>
        </div>

        {/* Bước 3 */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <StepBadge number={3} done={Boolean(result?.ok)} />
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Tính toán &amp; xuất báo cáo</h2>
              <p className="text-xs text-slate-500">
                Sinh 2 file Excel: bảng điểm CLO/PLO và phân tích đề thi
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={pickOutput}
              disabled={!bridgeReady || Boolean(busy)}
              className="flex-1 truncate rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-600 transition hover:border-blue-400 disabled:opacity-60"
              title={outDir}
            >
              {outDir ? `📁 ${outDir}` : 'Chọn thư mục lưu báo cáo…'}
            </button>
            <button
              type="button"
              onClick={run}
              disabled={!bridgeReady || !canRun}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'run' ? 'Đang tính & xuất…' : 'Tính toán & xuất báo cáo'}
            </button>
          </div>

          {result ? (
            <div className="mt-4 space-y-4">
              {result.ok ? (
                <>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <div className="text-xl font-bold text-slate-800">{result.studentCount}</div>
                      <div className="text-xs text-slate-500">Sinh viên</div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3 text-center">
                      <div className="text-xl font-bold text-emerald-700">
                        {result.passedPercent}%
                      </div>
                      <div className="text-xs text-emerald-600">Đạt học phần</div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-xl font-bold text-blue-700">
                        {result.meanCourseScore}
                      </div>
                      <div className="text-xs text-blue-600">Điểm TB học phần</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                      <div className="text-xl font-bold text-amber-700">
                        {result.absentFinalCount + result.missingDataCount}
                      </div>
                      <div className="text-xs text-amber-600">Vắng thi / thiếu điểm</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Tỷ lệ đạt theo CLO
                    </h3>
                    <div className="space-y-2">
                      {result.cloStats.map((stat) => (
                        <div key={stat.code} className="flex items-center gap-3 text-sm">
                          <span className="w-14 font-medium text-slate-700">{stat.code}</span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                stat.isBelowThreshold ? 'bg-red-400' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.max(0, Math.min(100, stat.passedPercent))}%` }}
                            />
                          </div>
                          <span
                            className={`w-24 text-right text-xs font-medium ${
                              stat.isBelowThreshold ? 'text-red-600' : 'text-slate-600'
                            }`}
                          >
                            {stat.passedPercent}% · TB {stat.mean}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phân tích đề thi
                    </h3>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="px-3 py-2 font-medium">Đợt</th>
                            <th className="px-3 py-2 font-medium">Mã đề</th>
                            <th className="px-3 py-2 font-medium">N</th>
                            <th className="px-3 py-2 font-medium">Cronbach α</th>
                            <th className="px-3 py-2 font-medium">Mức độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.exams.map((exam) => (
                            <tr key={`${exam.maDauDiem}-${exam.maDe}`} className="border-t">
                              <td className="px-3 py-2 font-medium text-slate-700">
                                {exam.maDauDiem}
                              </td>
                              <td className="px-3 py-2 text-slate-600">{exam.maDe}</td>
                              <td className="px-3 py-2 text-slate-600">{exam.n}</td>
                              <td className="px-3 py-2 text-slate-600">{exam.alpha}</td>
                              <td className="px-3 py-2 text-slate-600">{exam.mucDo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => result.outputDir && window.api.openPath(result.outputDir)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      📂 Mở thư mục báo cáo
                    </button>
                    {result.finalReportPath ? (
                      <button
                        type="button"
                        onClick={() => window.api.openPath(result.finalReportPath!)}
                        className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Bảng điểm CLO/PLO
                      </button>
                    ) : null}
                    {result.examReportPath ? (
                      <button
                        type="button"
                        onClick={() => window.api.openPath(result.examReportPath!)}
                        className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Phân tích đề thi
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dữ liệu cần lưu ý
                    </h3>
                    <IssueList issues={result.issues} limit={8} />
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {result.error ?? 'Không xuất được báo cáo.'}
                </div>
              )}
            </div>
          ) : null}
        </section>
      </main>

      <footer className="border-t bg-white px-6 py-3 text-center text-xs text-slate-400">
        Offline 100% · QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024 · Trường Đại học Thành Đông
      </footer>
    </div>
  )
}
