import React, { useState } from 'react'
import { ArrowLeft, ChartColumn, FileSpreadsheet, FolderOpen, Trash2, Upload, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useRunSnapshot } from '@renderer/hooks/use-run-snapshot'
import { useOpenCourseScreen } from '@renderer/hooks/use-open-course-screen'
import { latestDetailedRun } from '@renderer/lib/format'
import { LichSu } from '@renderer/components/history-panel'
import type { ScreenId } from '@renderer/lib/navigation'
import type { SessionDto } from '../../../../../shared/ipc'
import { CourseCloCard } from '@renderer/components/screens/courses/course-clo-card'
import { DeleteCourseDialog } from '@renderer/components/screens/courses/delete-course-dialog'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

/** Trang chi tiết một môn: thông tin, tệp đang dùng, cấu hình CLO và lịch sử chạy. */
export function CourseDetail({
  session,
  onBack,
  onScreen
}: {
  session: SessionDto
  onBack: () => void
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  const open = useOpenCourseScreen(onScreen)
  const { removeSession } = useWorkspace()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const lastRun = latestDetailedRun(session)
  const { snapshot, loading } = useRunSnapshot(lastRun?.runId)

  const meta = [
    session.lop,
    `${session.soTinChi} tín chỉ`,
    session.hocKy,
    session.namHoc,
    session.giangVien
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Quay lại danh sách môn">
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold">{session.courseName}</h2>
              <Badge variant="secondary" className="font-mono">
                {session.maHp}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {meta.length > 0 ? meta.join(' · ') : 'Chưa có thông tin lớp / học kỳ'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => open(session, 'import')}>
            <Upload data-icon="inline-start" />
            Nhập điểm
          </Button>
          <Button variant="outline" onClick={() => open(session, 'students')}>
            <Users data-icon="inline-start" />
            Sinh viên
          </Button>
          <Button onClick={() => open(session, 'reports')}>
            <ChartColumn data-icon="inline-start" />
            Báo cáo
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 data-icon="inline-start" />
            Xoá môn
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="gap-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin &amp; cấu hình</TabsTrigger>
          <TabsTrigger value="runs">Lần chạy ({session.history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Thông tin học phần</CardTitle>
                <CardDescription>Dùng để nhận diện môn trong toàn bộ ứng dụng</CardDescription>
              </CardHeader>
              <CardContent>
                <InfoRow label="Mã học phần" value={<span className="font-mono">{session.maHp}</span>} />
                <InfoRow label="Tên môn học" value={session.courseName} />
                <InfoRow label="Lớp" value={session.lop ?? '—'} />
                <InfoRow label="Số tín chỉ" value={session.soTinChi} />
                <InfoRow label="Học kỳ" value={session.hocKy ?? '—'} />
                <InfoRow label="Năm học" value={session.namHoc ?? '—'} />
                <InfoRow label="Giảng viên" value={session.giangVien ?? '—'} />
                <InfoRow label="Số CLO" value={session.cloCount ?? '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tệp đang dùng</CardTitle>
                <CardDescription>File Config, file điểm thô và thư mục báo cáo</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {[
                  { label: 'File Config', path: session.configPath },
                  { label: 'File điểm thô', path: session.rawPath },
                  { label: 'Thư mục báo cáo', path: session.outDir }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="truncate text-[13px]" title={item.path}>
                        {item.path ? item.path.split(/[\\/]/).pop() : 'Chưa chọn'}
                      </p>
                    </div>
                    {item.path ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={`Mở ${item.label}`}
                        onClick={() => window.api.openPath(item.path!)}
                      >
                        <FolderOpen />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <CourseCloCard snapshot={snapshot} loading={loading} />
        </TabsContent>

        <TabsContent value="runs">
          <LichSu sessionId={session.id} />
        </TabsContent>
      </Tabs>

      <DeleteCourseDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        session={session}
        onConfirm={() => {
          removeSession(session.id)
          onBack()
        }}
      />
    </div>
  )
}
