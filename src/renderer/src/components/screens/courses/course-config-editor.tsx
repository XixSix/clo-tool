import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@renderer/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@renderer/components/ui/select'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Field, FieldError, FieldLabel } from '@renderer/components/ui/field'
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Plus,
  Save,
  Trash2,
  Upload
} from 'lucide-react'
import { cn } from 'cn'
import type { Course } from '@core/types'
import type { BusinessRules, AttendanceRule } from '@core/types/rule'
import type { ValidationIssue } from '@core/types/validation'
import type { SessionDto } from '../../../../../shared/ipc'
import { useCourseValidation } from '@renderer/hooks/use-course-validation'
import {
  clearCourseDraft,
  readCourseDraft,
  writeCourseDraft
} from '@renderer/lib/course-draft'
import { PlanWizard } from './course-plan-wizard'
import type {
  CLODefinition,
  CourseConfig,
  CourseDetailTab,
  CourseInfo,
  EditorClo,
  EditorConfig,
  EditorPlo
} from './course-editor-types'
import {
  courseToEditor,
  editorConfigToCourse,
  normalizeEditorWeights,
  normalizeStoredCourse
} from './course-adapter'
import { CourseFilesCard } from './course-files-card'
import { IssueLines, TabIssueBadge, ValidationSummary } from './validation-summary'

/** Dữ liệu người dùng nhập thêm cho môn (không thuộc CourseConfig của core). */
export interface CourseMetaInput {
  lop?: string
  giangVien?: string
  namHoc?: string
}

// Default business rules from QĐ450
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  phuongThucTinhHp: 'QD450',
  nguongDatClo: 4.0,
  nguongDatPlo: 4.0,
  nguongDatHp: 4.0,
  cachTinhCloBoPhan: 'mean_of_ratios',
  cheDoLamTron: 'chain',
  tinhSvVangThi: true,
  canhBaoCcDonLe: true,
  tyLeNhom27: 0.27,
  nguongCoMauN: 30,
  tyLeDatCloCanhBao: 50
}

const DEFAULT_ATTENDANCE_RULES: AttendanceRule[] = [
  { kyHieu: 'V', heSo: 0, dienGiai: 'Vắng không phép' },
  { kyHieu: 'P', heSo: 1, dienGiai: 'Có phép' },
  { kyHieu: 'K', heSo: 1, dienGiai: 'Không tính' }
]

const EXAM_FORMATS = ['Tự luận', 'Trắc nghiệm']

interface CourseConfigEditorProps {
  session: SessionDto
  defaultTab?: CourseDetailTab
  onSave: (config: Course, meta: CourseMetaInput) => void
}

/** Key lưu cấu hình tạm cho mỗi môn (Phase 2 sẽ thay bằng IPC). */
export function courseConfigKey(sessionId: string): string {
  return `course-config-${sessionId}`
}

/** Autosave bản nháp: đủ chậm để không ghi mỗi keystroke, đủ nhanh để không mất việc. */
const DRAFT_AUTOSAVE_MS = 800

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function sumCloWeights(cloList: CLODefinition[]): number {
  return cloList.reduce((sum, clo) => sum + (clo.trongSoClo ?? 0), 0)
}

/** Danh sách CLO đã có mã hợp lệ, không trùng — dùng cho Select (Radix cấm value rỗng). */
function selectableCloCode(cloList: EditorClo[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const clo of cloList) {
    const code = clo.maClo.trim()
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

function defaultConfig(session: SessionDto): EditorConfig {
  return {
    courseInfo: {
      maHp: session.maHp,
      tenHp: session.courseName,
      soTinChi: session.soTinChi,
      hinhThucThi: EXAM_FORMATS[0],
      loaiHp: 'thuong'
    },
    cloList: [],
    keHoachDanhGia: [],
    cauHoi: [],
    maTranPlo: [],
    diemDanh: DEFAULT_ATTENDANCE_RULES,
    quyTac: DEFAULT_BUSINESS_RULES
  }
}

/** Dòng có thể đã có _id (nháp) hoặc chưa (JSON/IPC). */
function withRowId<T extends object>(row: T & { _id?: string }): T & { _id: string } {
  return { ...row, _id: row._id ?? generateId() }
}

/** Bổ sung _id còn thiếu và giá trị mặc định; không đụng tới trọng số người dùng đã nhập. */
function ensureEditor(config: CourseConfig): EditorConfig {
  return {
    ...config,
    cloList: (config.cloList ?? []).map(withRowId),
    keHoachDanhGia: (config.keHoachDanhGia ?? []).map(withRowId),
    cauHoi: (config.cauHoi ?? []).map(withRowId),
    maTranPlo: (config.maTranPlo ?? []).map(withRowId),
    diemDanh: config.diemDanh ?? DEFAULT_ATTENDANCE_RULES,
    quyTac: config.quyTac ?? DEFAULT_BUSINESS_RULES
  }
}

/** Gắn _id cho dữ liệu đọc từ JSON/IPC và chuẩn hoá trọng số về số nguyên cho core. */
function withIds(config: CourseConfig): EditorConfig {
  return normalizeEditorWeights(ensureEditor(config))
}

function metaFromSession(session: SessionDto): CourseMetaInput {
  return { lop: session.lop, giangVien: session.giangVien, namHoc: session.namHoc }
}

function stripRow<T extends { _id: string }>(row: T): Omit<T, '_id'> {
  const copy: Record<string, unknown> = { ...row }
  delete copy._id
  return copy as Omit<T, '_id'>
}

/**
 * Snapshot so sánh dirty: giữ cả dòng editor mà adapter bỏ khi sang Course
 * (CLO chưa có mã, dòng chưa chọn CLO…) để không mất trạng thái "đang làm dở".
 */
function snapshotOf(config: EditorConfig, meta: CourseMetaInput): string {
  return JSON.stringify({
    editor: {
      ...config,
      cloList: config.cloList.map(stripRow),
      keHoachDanhGia: config.keHoachDanhGia.map(stripRow),
      cauHoi: config.cauHoi.map(stripRow),
      maTranPlo: config.maTranPlo.map(stripRow)
    },
    meta
  })
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function CourseConfigEditor({
  session,
  defaultTab = 'info-clo',
  onSave
}: CourseConfigEditorProps): React.ReactElement {
  const initial = useMemo(() => {
    const defaultSnapshot = snapshotOf(defaultConfig(session), metaFromSession(session))
    const draft = readCourseDraft(localStorage, session.id)
    if (draft) {
      // Nháp có thể đang dở (còn lỗi) — nạp nguyên trạng, không chuẩn hoá trọng số.
      const config = ensureEditor(draft.editor)
      const meta: CourseMetaInput = {
        lop: draft.meta.lop ?? session.lop,
        giangVien: draft.meta.giangVien ?? session.giangVien,
        namHoc: draft.meta.namHoc ?? session.namHoc
      }
      const savedAt = new Date(draft.savedAt)
      return {
        config,
        meta,
        snapshot: null as string | null,
        defaultSnapshot,
        fromDraft: true,
        draftWrittenAt: Number.isNaN(savedAt.getTime()) ? null : savedAt
      }
    }
    const config = defaultConfig(session)
    const meta = metaFromSession(session)
    return {
      config,
      meta,
      snapshot: defaultSnapshot,
      defaultSnapshot,
      fromDraft: false,
      draftWrittenAt: null as Date | null
    }
  }, [session])

  const [config, setConfig] = useState<EditorConfig>(initial.config)
  const [meta, setMeta] = useState<CourseMetaInput>(initial.meta)
  /** Snapshot của cấu hình chính thức gần nhất; null = chưa biết (đang chờ IPC). */
  const [baseline, setBaseline] = useState<string | null>(initial.snapshot)
  const [activeTab, setActiveTab] = useState<CourseDetailTab>(defaultTab)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [draftWrittenAt, setDraftWrittenAt] = useState<Date | null>(initial.draftWrittenAt)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hasDraftRef = useRef(initial.fromDraft)
  const defaultSnapshotRef = useRef(initial.defaultSnapshot)

  const metaRef = useRef(meta)
  useEffect(() => {
    metaRef.current = meta
  }, [meta])

  useEffect(() => {
    let active = true

    const applyDefaultBaseline = (): void => {
      setBaseline(defaultSnapshotRef.current)
    }

    if (!window.api?.getCourseConfig) {
      applyDefaultBaseline()
      return () => {
        active = false
      }
    }

    window.api
      .getCourseConfig(session.id)
      .then((saved) => {
        if (!active) return
        if (!saved?.config) {
          applyDefaultBaseline()
          return
        }
        const nextConfig = withIds(courseToEditor(saved.config))
        const nextMeta: CourseMetaInput = saved.meta
          ? {
              lop: saved.meta.lop ?? session.lop,
              giangVien: saved.meta.giangVien ?? session.giangVien,
              namHoc: saved.meta.namHoc ?? session.namHoc
            }
          : metaRef.current
        // Có bản nháp thì giữ nguyên dữ liệu đang làm dở, chỉ lấy baseline từ cấu hình chính thức.
        if (!hasDraftRef.current) {
          setConfig(nextConfig)
          setMeta(nextMeta)
        }
        setBaseline(snapshotOf(nextConfig, nextMeta))
      })
      .catch(applyDefaultBaseline)

    return () => {
      active = false
    }
  }, [session.id, session.lop, session.giangVien, session.namHoc])

  const validation = useCourseValidation(config, meta)
  const {
    issues,
    courseField,
    clo: cloIssuesByCode,
    dot: dotIssues,
    question: questionIssues,
    ploCode: ploIssuesByCode,
    piCode: piIssuesByCode,
    cloGlobal,
    planGlobal,
    ploGlobal,
    tabStats,
    tabOfIssue,
    errorCount,
    warningCount,
    hasErrors,
    pending
  } = validation

  const cloCodes = selectableCloCode(config.cloList)
  const currentSnapshot = useMemo(() => snapshotOf(config, meta), [config, meta])
  const baselineReady = baseline !== null
  const dirty = baselineReady && currentSnapshot !== baseline

  // Autosave nháp: luôn giữ việc đang làm dở (kể cả khi cấu hình còn lỗi).
  // Dirty tắt (đã lưu / chưa sửa) thì xoá nháp vì cấu hình chính thức đã là bản mới nhất.
  useEffect(() => {
    if (!baselineReady) return
    if (!dirty) {
      clearCourseDraft(localStorage, session.id)
      return
    }
    const timer = setTimeout(() => {
      const draft = writeCourseDraft(localStorage, session.id, config, meta)
      setDraftWrittenAt(new Date(draft.savedAt))
    }, DRAFT_AUTOSAVE_MS)
    return () => clearTimeout(timer)
  }, [config, meta, session.id, baselineReady, dirty])

  // Ghi nốt nháp khi rời màn/đóng app trước khi hết debounce.
  const latestRef = useRef({ config, meta, dirty })
  useEffect(() => {
    latestRef.current = { config, meta, dirty }
  })
  useEffect(() => {
    const flush = (): void => {
      const latest = latestRef.current
      if (latest.dirty) writeCourseDraft(localStorage, session.id, latest.config, latest.meta)
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [session.id])

  const fieldIssues = (id: string): ValidationIssue[] => courseField[id] ?? []
  const fieldHasError = (id: string): boolean =>
    fieldIssues(id).some((issue) => issue.level === 'error')

  const handleSave = async (): Promise<void> => {
    if (saving || pending || hasErrors) return
    setSaving(true)
    setSaveError(null)
    try {
      const serialized = editorConfigToCourse(config, meta)
      if (window.api?.saveCourseConfig) {
        await window.api.saveCourseConfig(session.id, { config: serialized, meta })
      }
      sessionStorage.setItem(
        courseConfigKey(session.id),
        JSON.stringify({ config: serialized, meta })
      )
      onSave(serialized, meta)
      setBaseline(snapshotOf(config, meta))
      setSavedAt(new Date())
      clearCourseDraft(localStorage, session.id)
      setDraftWrittenAt(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Không lưu được cấu hình.')
    } finally {
      setSaving(false)
    }
  }

  const handleExportRawTemplate = async (): Promise<void> => {
    const serialized = editorConfigToCourse(config)
    if (window.api?.exportGradeSheetTemplate) {
      const res = await window.api.exportGradeSheetTemplate(serialized)
      if (res.ok && res.path) {
        alert(`Đã xuất file Template điểm thô:\n${res.path}`)
      } else if (res.error) {
        alert(`Lỗi xuất file: ${res.error}`)
      }
    }
  }

  const handleExportJson = (): void => {
    const json = JSON.stringify({ config: editorConfigToCourse(config, meta), meta }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.maHp}-config.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = (file: File): void => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as unknown
        const course = normalizeStoredCourse(parsed)
        if (!course) throw new Error('Cấu hình không hợp lệ')
        setConfig(withIds(courseToEditor(course)))
        if (parsed && typeof parsed === 'object' && 'meta' in parsed) {
          const metaValue = (parsed as { meta?: CourseMetaInput }).meta
          if (metaValue) setMeta(metaValue)
        }
      } catch {
        alert('File JSON không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  const patchCourseInfo = (patch: Partial<CourseInfo>): void =>
    setConfig((c) => ({ ...c, courseInfo: { ...c.courseInfo, ...patch } }))

  const setLoaiHp = (loaiHp: 'thuong' | 'thuc_hanh'): void =>
    setConfig((c) => ({
      ...c,
      courseInfo: { ...c.courseInfo, loaiHp },
      // Core yêu cầu khai báo trọng số CLO cho mọi CLO của học phần thực hành.
      cloList:
        loaiHp === 'thuc_hanh'
          ? c.cloList.map((clo) => ({ ...clo, trongSoClo: clo.trongSoClo ?? 1 }))
          : c.cloList
    }))

  // ===================== TAB 1: THÔNG TIN & CLO =====================
  const renderTab1 = (): React.ReactElement => (
    <TabsContent value="info-clo" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Thông tin học phần</CardTitle>
          <CardDescription>Dùng để nhận diện môn trong toàn bộ ứng dụng</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field data-invalid={fieldHasError('maHp') || undefined}>
            <FieldLabel htmlFor="maHp">Mã học phần *</FieldLabel>
            <Input
              id="maHp"
              value={config.courseInfo.maHp}
              aria-invalid={fieldHasError('maHp') || undefined}
              onChange={(e) => patchCourseInfo({ maHp: e.target.value.toUpperCase() })}
              className="font-mono"
            />
            <FieldError errors={fieldIssues('maHp')} />
          </Field>
          <Field data-invalid={fieldHasError('tenHp') || undefined}>
            <FieldLabel htmlFor="tenHp">Tên môn học *</FieldLabel>
            <Input
              id="tenHp"
              value={config.courseInfo.tenHp}
              aria-invalid={fieldHasError('tenHp') || undefined}
              onChange={(e) => patchCourseInfo({ tenHp: e.target.value })}
            />
            <FieldError errors={fieldIssues('tenHp')} />
          </Field>
          <Field data-invalid={fieldHasError('soTinChi') || undefined}>
            <FieldLabel htmlFor="soTinChi">Số tín chỉ *</FieldLabel>
            <Input
              id="soTinChi"
              type="number"
              min="1"
              step="1"
              value={config.courseInfo.soTinChi}
              aria-invalid={fieldHasError('soTinChi') || undefined}
              onChange={(e) => patchCourseInfo({ soTinChi: Number(e.target.value) || 0 })}
            />
            <FieldError errors={fieldIssues('soTinChi')} />
          </Field>
          <Field data-invalid={fieldHasError('hinhThucThi') || undefined}>
            <FieldLabel htmlFor="hinhThucThi">Hình thức thi</FieldLabel>
            <Select
              value={config.courseInfo.hinhThucThi}
              onValueChange={(v) => patchCourseInfo({ hinhThucThi: v })}
            >
              <SelectTrigger
                id="hinhThucThi"
                className="w-full"
                aria-invalid={fieldHasError('hinhThucThi') || undefined}
              >
                <SelectValue placeholder="Chọn hình thức thi" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={fieldIssues('hinhThucThi')} />
          </Field>
          <Field data-invalid={fieldHasError('loaiHp') || undefined}>
            <FieldLabel htmlFor="loaiHp">Loại học phần</FieldLabel>
            <Select
              value={config.courseInfo.loaiHp}
              onValueChange={(v) => setLoaiHp(v as 'thuong' | 'thuc_hanh')}
            >
              <SelectTrigger
                id="loaiHp"
                className="w-full"
                aria-invalid={fieldHasError('loaiHp') || undefined}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thuong">Thường</SelectItem>
                <SelectItem value="thuc_hanh">Thực hành</SelectItem>
              </SelectContent>
            </Select>
            <FieldError errors={fieldIssues('loaiHp')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="lop">Lớp</FieldLabel>
            <Input
              id="lop"
              value={meta.lop ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, lop: e.target.value }))}
              placeholder="VD: D21-1"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="giangVien">Giảng viên</FieldLabel>
            <Input
              id="giangVien"
              value={meta.giangVien ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, giangVien: e.target.value }))}
              placeholder="VD: Nguyễn Văn A"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="namHoc">Năm học</FieldLabel>
            <Input
              id="namHoc"
              value={meta.namHoc ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, namHoc: e.target.value }))}
              placeholder="VD: 2024-2025"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Danh sách CLO */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Danh sách CLO</CardTitle>
            <CardDescription>Mã CLO, nội dung, trọng số. Tổng trọng số phải = 100%</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                cloList: [
                  ...c.cloList,
                  { _id: generateId(), maClo: '', noiDung: '', bacNangLuc: '', trongSoClo: 1 }
                ]
              }))
            }
          >
            <Plus className="mr-1 size-4" /> Thêm CLO
          </Button>
        </CardHeader>
        <CardContent>
          {cloGlobal.length > 0 ? <IssueLines issues={cloGlobal} className="mb-3" /> : null}
          {config.cloList.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Chưa có CLO. Bấm "Thêm CLO" để bắt đầu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead className="w-32">Mã CLO</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead className="w-32">Bậc năng lực</TableHead>
                    {config.courseInfo.loaiHp === 'thuc_hanh' && (
                      <TableHead className="w-24">Trọng số %</TableHead>
                    )}
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.cloList.map((clo, index) => {
                    const code = clo.maClo.trim()
                    const rowIssues = code
                      ? (cloIssuesByCode[code] ?? [])
                      : (cloIssuesByCode['__empty__'] ?? [])
                    const rowHasError = rowIssues.some((issue) => issue.level === 'error')
                    const columnCount = config.courseInfo.loaiHp === 'thuc_hanh' ? 6 : 5
                    return (
                      <React.Fragment key={clo._id}>
                        <TableRow>
                          <TableCell className="text-muted-foreground text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={clo.maClo}
                              aria-invalid={rowHasError || undefined}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  cloList: c.cloList.map((x) =>
                                    x._id === clo._id
                                      ? { ...x, maClo: e.target.value.toUpperCase() }
                                      : x
                                  )
                                }))
                              }
                              className="font-mono text-sm"
                              placeholder="VD: CLO1"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={clo.noiDung}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  cloList: c.cloList.map((x) =>
                                    x._id === clo._id ? { ...x, noiDung: e.target.value } : x
                                  )
                                }))
                              }
                              className="text-sm"
                              placeholder="Mô tả CLO"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={clo.bacNangLuc}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  cloList: c.cloList.map((x) =>
                                    x._id === clo._id ? { ...x, bacNangLuc: e.target.value } : x
                                  )
                                }))
                              }
                              className="font-mono text-sm"
                              placeholder="VD: 3/6"
                            />
                          </TableCell>
                          {config.courseInfo.loaiHp === 'thuc_hanh' && (
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={clo.trongSoClo ?? ''}
                                aria-invalid={rowHasError || undefined}
                                onChange={(e) =>
                                  setConfig((c) => ({
                                    ...c,
                                    cloList: c.cloList.map((x) =>
                                      x._id === clo._id
                                        ? { ...x, trongSoClo: Number(e.target.value) || 0 }
                                        : x
                                    )
                                  }))
                                }
                                className="w-20 text-right font-mono text-sm"
                              />
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setConfig((c) => ({
                                  ...c,
                                  cloList: c.cloList.filter((x) => x._id !== clo._id)
                                }))
                              }
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {rowIssues.length > 0 ? (
                          <TableRow>
                            <TableCell colSpan={columnCount} className="border-0 pt-0">
                              <IssueLines issues={rowIssues} />
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {config.cloList.length > 0 && config.courseInfo.loaiHp === 'thuc_hanh' && (
            <div
              className={cn(
                'mt-3 flex items-center gap-2 text-sm',
                Math.abs(sumCloWeights(config.cloList) - 100) < 0.01
                  ? 'text-success'
                  : 'text-destructive'
              )}
            >
              <CheckCircle className="size-4" />
              <span>Tổng trọng số: {sumCloWeights(config.cloList).toFixed(2)}%</span>
              {Math.abs(sumCloWeights(config.cloList) - 100) >= 0.01 && (
                <AlertCircle className="size-4" />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CourseFilesCard session={session} />
    </TabsContent>
  )

  // ===================== TAB 2: KẾ HOẠCH & ĐỀ THI (WIZARD THEO ĐỢT) =====================
  const renderTab2 = (): React.ReactElement => (
    <TabsContent value="plan-exam" className="space-y-6">
      <PlanWizard
        config={config}
        setConfig={setConfig}
        cloCodes={cloCodes}
        dotIssues={dotIssues}
        questionIssues={questionIssues}
        planGlobal={planGlobal}
      />
    </TabsContent>
  )

  // ===================== TAB 3: MA TRẬN PLO =====================
  const renderTab3 = (): React.ReactElement => (
    <TabsContent value="plo" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Ma trận PLO</CardTitle>
            <CardDescription>
              Ánh xạ CLO ↔ PLO ↔ PI. Mỗi CLO có thể map tới nhiều PLO/PI
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                maTranPlo: [...c.maTranPlo, { _id: generateId(), plo: '', pi: '', clo: '' }]
              }))
            }
          >
            <Plus className="mr-1 size-4" /> Thêm dòng
          </Button>
        </CardHeader>
        <CardContent>
          {ploGlobal.length > 0 ? <IssueLines issues={ploGlobal} className="mb-3" /> : null}
          {config.maTranPlo.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">Chưa có ánh xạ PLO.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">STT</TableHead>
                    <TableHead className="w-32">PLO</TableHead>
                    <TableHead className="w-32">PI</TableHead>
                    <TableHead className="w-32">CLO</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.maTranPlo.map((mapping, index) => {
                    const patchPlo = (patch: Partial<EditorPlo>): void =>
                      setConfig((c) => ({
                        ...c,
                        maTranPlo: c.maTranPlo.map((x) =>
                          x._id === mapping._id ? { ...x, ...patch } : x
                        )
                      }))
                    const rowIssues = [
                      ...(ploIssuesByCode[mapping.plo.trim()] ?? []),
                      ...(piIssuesByCode[mapping.pi.trim()] ?? [])
                    ]
                    const hasRowError = rowIssues.some((i) => i.level === 'error')
                    return (
                      <React.Fragment key={mapping._id}>
                        <TableRow>
                          <TableCell className="text-muted-foreground text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={mapping.plo}
                              onChange={(e) => patchPlo({ plo: e.target.value.toUpperCase() })}
                              className="font-mono text-sm"
                              placeholder="VD: PLO1"
                              aria-invalid={hasRowError || undefined}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={mapping.pi}
                              onChange={(e) => patchPlo({ pi: e.target.value.toUpperCase() })}
                              className="font-mono text-sm"
                              placeholder="VD: PI1.1"
                              aria-invalid={hasRowError || undefined}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping.clo || undefined}
                              onValueChange={(v) => patchPlo({ clo: v })}
                              disabled={cloCodes.length === 0}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn CLO" />
                              </SelectTrigger>
                              <SelectContent>
                                {cloCodes.map((code) => (
                                  <SelectItem key={code} value={code}>
                                    {code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setConfig((c) => ({
                                  ...c,
                                  maTranPlo: c.maTranPlo.filter((x) => x._id !== mapping._id)
                                }))
                              }
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {rowIssues.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="pt-0">
                              <IssueLines issues={rowIssues} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {config.maTranPlo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground">Số PLO duy nhất</p>
              <p className="text-xl font-bold">
                {new Set(config.maTranPlo.map((m) => m.plo)).size}
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground">Số PI duy nhất</p>
              <p className="text-xl font-bold">{new Set(config.maTranPlo.map((m) => m.pi)).size}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground">Số CLO được map</p>
              <p className="text-xl font-bold">
                {new Set(config.maTranPlo.map((m) => m.clo)).size} / {config.cloList.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  )

  // ===================== RENDER =====================
  return (
    <div className="flex h-full flex-col gap-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as CourseDetailTab)}
        className="flex flex-1 flex-col"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info-clo" className="gap-1.5">
            1. Thông tin &amp; CLO
            <TabIssueBadge
              errors={tabStats['info-clo'].errors}
              warnings={tabStats['info-clo'].warnings}
            />
          </TabsTrigger>
          <TabsTrigger value="plan-exam" className="gap-1.5">
            2. Kế hoạch &amp; Đề thi
            <TabIssueBadge
              errors={tabStats['plan-exam'].errors}
              warnings={tabStats['plan-exam'].warnings}
            />
          </TabsTrigger>
          <TabsTrigger value="plo" className="gap-1.5">
            3. Ma trận PLO
            <TabIssueBadge errors={tabStats.plo.errors} warnings={tabStats.plo.warnings} />
          </TabsTrigger>
        </TabsList>

        <ValidationSummary
          issues={issues}
          errorCount={errorCount}
          warningCount={warningCount}
          hasErrors={hasErrors}
          tabOfIssue={tabOfIssue}
          onJump={setActiveTab}
        />

        {renderTab1()}
        {renderTab2()}
        {renderTab3()}
      </Tabs>

      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-center gap-2 text-sm" role="status">
          <span className={cn('font-medium', dirty ? 'text-foreground' : 'text-muted-foreground')}>
            {!baselineReady
              ? 'Đang tải cấu hình đã lưu…'
              : dirty
                ? 'Có thay đổi chưa lưu'
                : savedAt
                  ? `Đã lưu lúc ${formatClock(savedAt)}`
                  : 'Chưa có thay đổi'}
          </span>
          {dirty && draftWrittenAt && (
            <Badge
              variant="secondary"
              title="Bản nháp được tự lưu trên máy — khác với cấu hình đã lưu chính thức"
            >
              Nháp {formatClock(draftWrittenAt)}
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive">
              <AlertCircle className="size-3" />
              Còn {errorCount} lỗi
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline">
              <AlertCircle className="size-3" />
              {warningCount} cảnh báo
            </Badge>
          )}
          {pending && <span className="text-muted-foreground text-xs">Đang kiểm tra…</span>}
          {saveError && <span className="text-destructive text-xs">{saveError}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportRawTemplate}
            disabled={pending || hasErrors}
            title={
              hasErrors
                ? 'Cần sửa các lỗi cấu hình trước khi xuất mẫu'
                : 'Xuất file Excel mẫu để giảng viên nhập điểm'
            }
          >
            <FileSpreadsheet className="mr-1 size-4" />
            Xuất mẫu điểm thô
          </Button>
          <Button variant="outline" onClick={handleExportJson}>
            <Download className="mr-1 size-4" />
            Xuất JSON
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload className="mr-1 size-4" />
                Nhập JSON
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImportJson(e.target.files[0])}
            />
          </label>
          <Button
            variant={dirty ? 'default' : 'outline'}
            onClick={handleSave}
            disabled={saving || pending || hasErrors}
          >
            <Save className="mr-1 size-4" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </div>
      </div>
    </div>
  )
}
