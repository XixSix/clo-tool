import React, { useState } from 'react'
import { ArrowLeft, ChartColumn, Trash2, Upload, Users } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useOpenCourseScreen } from '@renderer/hooks/use-open-course-screen'
import type { ScreenId } from '@renderer/lib/navigation'
import type { SessionDto } from '../../../../../shared/ipc'
import { DeleteCourseDialog } from '@renderer/components/screens/courses/delete-course-dialog'
import { CourseConfigEditor } from '@renderer/components/screens/courses/course-config-editor'
import type { CourseDetailTab } from '@renderer/components/screens/courses/course-editor-types'

/** Trang chi tiết một môn: tiêu đề, hành động nhanh và editor cấu hình CLO/PLO. */
export function CourseDetail({
  session,
  defaultTab = 'info-clo',
  onBack,
  onScreen
}: {
  session: SessionDto
  defaultTab?: CourseDetailTab
  onBack: () => void
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  const open = useOpenCourseScreen(onScreen)
  const { removeSession, patchSession } = useWorkspace()
  const [confirmDelete, setConfirmDelete] = useState(false)

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
            <p className="text-muted-foreground mt-0.5 text-[13px]">
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

      <CourseConfigEditor
        key={session.id}
        session={session}
        defaultTab={defaultTab}
        onSave={(config, metaInput) => {
          patchSession(session.id, {
            maHp: config.maHp,
            courseName: config.tenHp,
            soTinChi: config.soTinChi,
            lop: metaInput.lop?.trim() || undefined,
            giangVien: metaInput.giangVien?.trim() || undefined,
            namHoc: metaInput.namHoc?.trim() || undefined,
            cloCount: config.cloList.length
          })
        }}
      />

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
