import React, { useState } from 'react'
import {
  ArrowLeft,
  ChartColumn,
  EllipsisVertical,
  FileSpreadsheet,
  FolderOpen,
  LibraryBig,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  Users
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { hasBridge } from '@renderer/lib/theme'
import { newSessionId, useWorkspace } from '@renderer/lib/workspace'
import { useRunSnapshot } from '@renderer/lib/runs'
import { formatDateTime, formatPercent, formatScore, latestDetailedRun } from '@renderer/lib/format'
import { LichSu } from '@renderer/components/screens/history'
import type { ScreenId } from '@renderer/components/app-shell'
import type { ConfigSummaryDto, SessionDto } from '../../../../shared/ipc'

interface FormState {
  maHp: string
  courseName: string
  soTinChi: string
  lop: string
  hocKy: string
  namHoc: string
  configPath: string
}

function AddCourseDialog({
  open,
  onOpenChange,
  onSubmit
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (s: SessionDto) => void
}): React.ReactElement {
  const bridgeReady = hasBridge()
  const [form, setForm] = useState<FormState>({
    maHp: '',
    courseName: '',
    soTinChi: '3',
    lop: '',
    hocKy: '',
    namHoc: '',
    configPath: ''
  })
  const [config, setConfig] = useState<ConfigSummaryDto | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function field<K extends keyof FormState>(key: K) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }))
    }
  }

  async function pickConfig(): Promise<void> {
    setError('')
    setBusy(true)
    try {
      const p = await window.api.pickFile('config')
      if (!p) return
      const summary = await window.api.parseConfig(p)
      setForm((f) => ({
        ...f,
        configPath: p,
        // Pre-fill từ file Config nếu đang trống
        maHp: f.maHp || summary.maHp || '',
        courseName: f.courseName || summary.courseName || '',
        soTinChi: summary.soTinChi ? String(summary.soTinChi) : f.soTinChi,
        lop: f.lop || summary.lop || '',
        hocKy: f.hocKy || summary.hocKy || '',
        namHoc: f.namHoc || summary.namHoc || ''
      }))
      setConfig(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đọc được file Config.')
    } finally {
      setBusy(false)
    }
  }

  function submit(): void {
    if (!form.maHp.trim() || !form.courseName.trim()) return
    const now = Date.now()
    onSubmit({
      id: newSessionId(),
      maHp: form.maHp.trim().toUpperCase(),
      courseName: form.courseName.trim(),
      soTinChi: Number(form.soTinChi) || 0,
      lop: form.lop.trim() || undefined,
      hocKy: form.hocKy.trim() || undefined,
      namHoc: form.namHoc.trim() || undefined,
      cloCount: config?.ok ? config.cloList.length : undefined,
      configPath: form.configPath || undefined,
      addedAt: now,
      lastOpenedAt: now,
      history: []
    })
    onOpenChange(false)
    setForm({
      maHp: '',
      courseName: '',
      soTinChi: '3',
      lop: '',
      hocKy: '',
      namHoc: '',
      configPath: ''
    })
    setConfig(null)
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm môn học</DialogTitle>
          <DialogDescription>
            Điền thủ công hoặc chọn file Config để tự điền thông tin.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ma-hp">Mã học phần *</FieldLabel>
            <Input id="ma-hp" placeholder="VD: KTLT101" className="font-mono" {...field('maHp')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="course-name">Tên môn học *</FieldLabel>
            <Input
              id="course-name"
              placeholder="VD: Kỹ thuật lập trình"
              {...field('courseName')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="so-tin-chi">Số tín chỉ</FieldLabel>
              <Input id="so-tin-chi" type="number" min="1" step="1" {...field('soTinChi')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lop">Lớp</FieldLabel>
              <Input id="lop" placeholder="VD: D21-1" {...field('lop')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="hoc-ky">Học kỳ</FieldLabel>
              <Input id="hoc-ky" placeholder="VD: HK1" {...field('hocKy')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="nam-hoc">Năm học</FieldLabel>
              <Input id="nam-hoc" placeholder="VD: 2025-2026" {...field('namHoc')} />
            </Field>
          </div>
          <Field>
            <FieldLabel>File Config</FieldLabel>
            <Button type="button" variant="outline" onClick={pickConfig} disabled={busy || !bridgeReady}>
              {form.configPath ? 'Chọn file khác…' : 'Chọn file Template_Config.xlsx…'}
            </Button>
            <FieldDescription>
              {busy
                ? 'Đang đọc file…'
                : form.configPath || 'Tùy chọn — chỉ dùng đọc trước thông tin môn'}
            </FieldDescription>
          </Field>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {config?.ok ? (
            <p className="text-xs text-success">
              Đã đọc: {config.cloList.length} CLO · {config.planCount} đầu điểm
            </p>
          ) : null}
        </FieldGroup>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!form.maHp.trim() || !form.courseName.trim()}>
            Thêm môn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Mở màn gắn với môn: đặt môn hiện tại rồi chuyển màn */
function useOpenCourseScreen(
  onScreen: (s: ScreenId) => void
): (session: SessionDto, s: ScreenId) => void {
  const { setActiveSession } = useWorkspace()
  return (session, screen) => {
    setActiveSession(session.id)
    onScreen(screen)
  }
}

function CourseCard({
  session,
  isActive,
  onOpen,
  onDetail
}: {
  session: SessionDto
  isActive: boolean
  onOpen: (session: SessionDto, screen: ScreenId) => void
  onDetail: (session: SessionDto) => void
}): React.ReactElement {
  const { setActiveSession, removeSession } = useWorkspace()
  const lastRun = session.history[session.history.length - 1]

  return (
    <Card
      className={
        isActive ? 'ring-2 ring-foreground/20 transition hover:shadow-md' : 'transition hover:shadow-md'
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onDetail(session)}
            className="truncate text-left font-mono text-base font-medium hover:underline"
            title="Xem chi tiết môn học"
          >
            {session.maHp}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-my-2 -mr-2 size-7 text-muted-foreground">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setActiveSession(session.id)}>
                  {isActive ? 'Đang là môn hiện tại' : 'Đặt làm môn hiện tại'}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => removeSession(session.id)}>
                  <Trash2 /> Xoá môn
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="line-clamp-2">{session.courseName}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {session.lop ? <Badge variant="outline">{session.lop}</Badge> : null}
          <Badge variant="secondary">{session.soTinChi} tín chỉ</Badge>
          {session.cloCount ? <Badge variant="secondary">{session.cloCount} CLO</Badge> : null}
          {isActive ? <Badge>Đang chọn</Badge> : null}
        </div>

        {lastRun ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Đạt học phần</span>
              <span className="font-medium">{formatPercent(lastRun.passedPercent)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {lastRun.studentCount} sinh viên · TB {formatScore(lastRun.meanCourseScore)}
              </span>
              <span>{formatDateTime(lastRun.ts)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Chưa nhập điểm lần nào</p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpen(session, 'students')}>
          <Users data-icon="inline-start" />
          Sinh viên
        </Button>
        <Button variant="outline" size="sm" onClick={() => onOpen(session, 'reports')}>
          <ChartColumn data-icon="inline-start" />
          Báo cáo
        </Button>
        <span className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => onOpen(session, 'import')}>
          <Upload data-icon="inline-start" />
          Nhập điểm
        </Button>
      </CardFooter>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function CourseDetail({
  session,
  onBack,
  onScreen
}: {
  session: SessionDto
  onBack: () => void
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  const open = useOpenCourseScreen(onScreen)
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cấu hình CLO / đầu điểm</CardTitle>
              <CardDescription>
                Đọc từ snapshot lần chạy gần nhất — nguồn chính vẫn là file Excel
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              ) : !snapshot ? (
                <Empty className="border-none">
                  <EmptyHeader>
                    <ShieldCheck className="text-muted-foreground/40" />
                    <EmptyTitle>Chưa có cấu hình chi tiết</EmptyTitle>
                    <EmptyDescription>
                      Chạy “Nhập điểm” một lần để ứng dụng lưu lại cấu hình CLO, đầu điểm và quy
                      tắc của học phần.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.config.cloList.map((clo) => (
                      <Badge key={clo.maClo} variant="secondary" title={clo.noiDung}>
                        {clo.maClo}
                        {clo.trongSoClo && clo.trongSoClo !== 1 ? ` · HS ${clo.trongSoClo}` : ''}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-muted-foreground">Đầu điểm</p>
                      <p className="mt-1 text-lg font-semibold">
                        {snapshot.config.keHoachDanhGia.length}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-muted-foreground">Câu hỏi</p>
                      <p className="mt-1 text-lg font-semibold">{snapshot.config.cauHoi.length}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-muted-foreground">Ánh xạ PLO</p>
                      <p className="mt-1 text-lg font-semibold">{snapshot.config.maTranPlo.length}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
                    {snapshot.config.keHoachDanhGia.map((item) => (
                      <div
                        key={`${item.nhom}-${item.maDauDiem}-${item.clo}`}
                        className="flex items-center gap-2 border-b border-border/60 px-3 py-2 text-xs last:border-0"
                      >
                        <Badge variant="outline" className="font-mono">
                          {item.maDauDiem}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate">{item.thanhPhan}</span>
                        <span className="text-muted-foreground">{item.clo}</span>
                        <span className="w-12 text-right font-mono">{item.trongSoPhanTram}%</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Ngưỡng đạt: CLO {snapshot.config.quyTac.nguong_dat_clo} · PLO{' '}
                    {snapshot.config.quyTac.nguong_dat_plo} · Học phần{' '}
                    {snapshot.config.quyTac.nguong_dat_hp} · Phương thức{' '}
                    {snapshot.config.quyTac.hp_method}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="runs">
          <LichSu sessionId={session.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function MonHoc({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { ws, loading, active, upsertSession } = useWorkspace()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const openCourse = useOpenCourseScreen(onScreen)

  const detail = (ws?.sessions ?? []).find((s) => s.id === detailId) ?? null

  if (detail) {
    return <CourseDetail session={detail} onBack={() => setDetailId(null)} onScreen={onScreen} />
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Danh sách môn học</h2>
          <p className="text-[13px] text-muted-foreground/80">
            {ws?.sessions.length ?? 0} môn đã quản lý
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          Thêm môn
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (ws?.sessions.length ?? 0) === 0 ? (
        <Empty className="rounded-xl border border-dashed border-border">
          <EmptyHeader>
            <LibraryBig />
            <EmptyTitle>Chưa có môn học nào</EmptyTitle>
            <EmptyDescription>
              Thêm môn học đầu tiên để bắt đầu quản lý File Config, File điểm và lịch sử báo cáo.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus data-icon="inline-start" />
            Thêm môn học
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ws!.sessions.map((s) => (
            <CourseCard
              key={s.id}
              session={s}
              isActive={active?.id === s.id}
              onDetail={(session) => setDetailId(session.id)}
              onOpen={(session, screen) => openCourse(session, screen)}
            />
          ))}
        </div>
      )}

      <AddCourseDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={upsertSession} />
    </div>
  )
}
