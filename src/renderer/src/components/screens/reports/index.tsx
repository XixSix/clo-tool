import React, { useState } from 'react'
import { Download, FileSpreadsheet, TriangleAlert, Upload } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useRunSnapshot } from '@renderer/hooks/use-run-snapshot'
import { RunSelector } from '@renderer/components/report/run-selector'
import { PrintReport } from '@renderer/components/report/print-report'
import { LichSu } from '@renderer/components/history-panel'
import { latestDetailedRun } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import { OverviewTab } from '@renderer/components/screens/reports/overview-tab'
import { ExamsTab } from '@renderer/components/screens/reports/exams-tab'
import { ExportTab } from '@renderer/components/screens/reports/export-tab'

export function BaoCao({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const latest = latestDetailedRun(active)
  const [runId, setRunId] = useState<string>(latest?.runId ?? '')
  const { snapshot, loading, error } = useRunSnapshot(runId || undefined)
  const [tab, setTab] = useState('overview')

  if (!active) {
    return (
      <Empty className="border-border rounded-xl border border-dashed">
        <EmptyHeader>
          <FileSpreadsheet className="text-muted-foreground/40" />
          <EmptyTitle>Chưa có môn học</EmptyTitle>
          <EmptyDescription>
            Thêm môn học và nhập điểm để xem thống kê, biểu đồ và xuất báo cáo.
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
          <FileSpreadsheet className="text-muted-foreground/40" />
          <EmptyTitle>
            {active.history.length > 0 ? 'Lần chạy cũ chưa lưu chi tiết' : 'Chưa có báo cáo nào'}
          </EmptyTitle>
          <EmptyDescription>
            {active.history.length > 0
              ? 'Các lần chạy trước phiên bản này chỉ lưu số tổng hợp. Chạy lại “Nhập điểm” để xem báo cáo đầy đủ.'
              : 'Nhập file Config và file điểm thô để ứng dụng tính toán và tạo báo cáo.'}
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </Empty>
    )
  }

  const currentRun = active.history.find((run) => run.runId === runId) ?? latest

  return (
    <>
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <RunSelector session={active} runId={runId} onSelect={setRunId} />
            <p className="text-muted-foreground text-xs">
              {active.courseName}
              {active.lop ? ` · Lớp ${active.lop}` : ''}
              {snapshot ? ` · ${snapshot.students.length} sinh viên` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onScreen('import')}>
              <Upload data-icon="inline-start" />
              Nhập điểm
            </Button>
            <Button size="sm" onClick={() => setTab('export')}>
              <Download data-icon="inline-start" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            <TriangleAlert className="size-4" />
            {error}
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="exams">Phân tích đề thi</TabsTrigger>
            <TabsTrigger value="history">Lịch sử chạy</TabsTrigger>
            <TabsTrigger value="export">Xuất báo cáo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {loading || !snapshot ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-56 rounded-xl" />
              </div>
            ) : (
              <OverviewTab snapshot={snapshot} />
            )}
          </TabsContent>

          <TabsContent value="exams">
            {loading || !snapshot ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <ExamsTab snapshot={snapshot} />
            )}
          </TabsContent>

          <TabsContent value="history">
            <LichSu sessionId={active.id} />
          </TabsContent>

          <TabsContent value="export">
            {loading || !snapshot ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <ExportTab
                run={currentRun}
                snapshot={snapshot}
                session={active}
                onScreen={onScreen}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {snapshot ? <PrintReport snapshot={snapshot} session={active} run={currentRun} /> : null}
    </>
  )
}
