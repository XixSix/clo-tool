import React, { useState } from 'react'
import { Download, Search, TriangleAlert, Upload, Users } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useRunSnapshot } from '@renderer/hooks/use-run-snapshot'
import {
  FILTER_LABELS,
  useStudentFilters,
  type FilterId
} from '@renderer/hooks/use-student-filters'
import { RunSelector } from '@renderer/components/report/run-selector'
import { downloadCsv } from '@renderer/lib/csv'
import { latestDetailedRun } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import { StudentTable } from '@renderer/components/screens/students/student-table'
import { StudentDetailSheet } from '@renderer/components/screens/students/student-detail-sheet'
import {
  buildStudentCsvRows,
  studentCsvFileName
} from '@renderer/components/screens/students/export-csv'
import type { ProcessedStudentResultView } from '@renderer/lib/result-view'

export function SinhVien({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const latest = latestDetailedRun(active)
  const [runId, setRunId] = useState<string>(latest?.runId ?? '')
  const [selected, setSelected] = useState<ProcessedStudentResultView | null>(null)
  const { snapshot, loading, error } = useRunSnapshot(runId || undefined)
  const { filter, setFilter, query, setQuery, rows, counts, visible } = useStudentFilters(snapshot)

  function exportCsv(): void {
    if (!active || !snapshot) return
    downloadCsv(studentCsvFileName(active), buildStudentCsvRows(visible))
  }

  if (!active) {
    return (
      <Empty className="border-border rounded-xl border border-dashed">
        <EmptyHeader>
          <Users className="text-muted-foreground/40" />
          <EmptyTitle>Chưa có môn học</EmptyTitle>
          <EmptyDescription>
            Thêm môn học và nhập điểm để xem danh sách sinh viên cùng kết quả CLO/PLO.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('courses')}>Quản lý môn học</Button>
      </Empty>
    )
  }

  if (!latest) {
    return (
      <Empty className="border-border rounded-xl border border-dashed">
        <EmptyHeader>
          <Users className="text-muted-foreground/40" />
          <EmptyTitle>
            {active.history.length > 0
              ? 'Lần chạy cũ chưa lưu chi tiết'
              : 'Chưa có kết quả học phần'}
          </EmptyTitle>
          <EmptyDescription>
            {active.history.length > 0
              ? 'Các lần chạy trước phiên bản này chỉ lưu số tổng hợp. Chạy lại “Nhập điểm” để xem chi tiết từng sinh viên.'
              : 'Nhập file Config và file điểm thô để ứng dụng tính toán và lưu kết quả từng sinh viên.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <RunSelector session={active} runId={runId} onSelect={setRunId} />
          {snapshot ? (
            <p className="text-muted-foreground text-xs">
              {active.courseName}
              {active.lop ? ` · Lớp ${active.lop}` : ''} · {snapshot.students.length} sinh viên
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={!snapshot || visible.length === 0}
          >
            <Download data-icon="inline-start" />
            Xuất CSV
          </Button>
          <Button size="sm" onClick={() => onScreen('import')}>
            <Upload data-icon="inline-start" />
            Nhập điểm
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABELS) as FilterId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? 'secondary' : 'ghost'}
            className="rounded-full"
            onClick={() => setFilter(id)}
          >
            {FILTER_LABELS[id]}
            <span className="text-muted-foreground ml-1 text-xs">{counts[id]}</span>
          </Button>
        ))}
        <span className="flex-1" />
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            aria-label="Tìm sinh viên"
            placeholder="Tìm mã SV hoặc họ tên…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
          <TriangleAlert className="size-4" />
          {error}
        </div>
      ) : null}

      <StudentTable rows={visible} loading={loading} onSelect={setSelected} />

      <p className="text-muted-foreground text-xs">
        Hiển thị {visible.length}/{rows.length} sinh viên. Nhấn vào một dòng để xem chi tiết và vết
        tính điểm.
      </p>

      {snapshot ? (
        <StudentDetailSheet
          student={selected}
          snapshot={snapshot}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  )
}
