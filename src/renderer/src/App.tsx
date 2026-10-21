import React, { useEffect, useState } from 'react'

export default function App(): React.ReactElement {
  const [pingResult, setPingResult] = useState<string>(() => {
    return typeof window !== 'undefined' && 'api' in window
      ? 'Đang kiểm tra...'
      : 'Chế độ Web Preview (Không có Electron IPC)'
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && 'api' in window) {
      window.api
        .ping()
        .then((res: string) => setPingResult(`IPC Hoạt động tốt (${res})`))
        .catch(() => setPingResult('IPC Không phản hồi'))
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                CLO/PLO Evaluator &ndash; Đại học Thành Đông
              </h1>
              <p className="text-xs text-slate-500">
                Phần mềm đo lường & đánh giá CĐR học phần theo QĐ 450/QĐ-ĐHTĐ
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Giai đoạn 1: Skeleton Đã Khởi Tạo
          </span>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="mx-auto w-full max-w-5xl flex-1 p-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold text-slate-800">
            Trạng thái Hạ tầng Dự án (Phase 1 Ready)
          </h2>
          <p className="mb-6 text-sm text-slate-600">
            Dự án đã được thiết lập thành công với khung Electron + Vite + React + TypeScript +
            Tailwind CSS + ESLint + Prettier.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                IPC Main &harr; Renderer
              </div>
              <div className="text-sm font-medium text-emerald-600">{pingResult}</div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Core Engine Phân Tầng
              </div>
              <div className="text-sm font-medium text-slate-700">
                <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">src/core/</code> (Độc lập
                100%)
              </div>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bộ Test Tự Động
              </div>
              <div className="text-sm font-medium text-slate-700">Vitest runner cấu hình sẵn</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-3 text-center text-xs text-slate-400">
        Offline 100% &bull; Quy chuẩn QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024 &bull; Trường Đại học Thành Đông
      </footer>
    </div>
  )
}
