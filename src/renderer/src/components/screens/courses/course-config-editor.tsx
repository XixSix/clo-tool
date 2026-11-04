import React, { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
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
import { Alert, AlertDescription } from '@renderer/components/ui/alert'
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
import type {
  CourseConfig,
  CourseInfo,
  CLODefinition,
  EvaluationPlanItem,
  QuestionColumn,
  PLOMapping
} from '@core/types/course'
import type { BusinessRules, AttendanceRule } from '@core/types/rule'
import type { SessionDto } from '../../../../../shared/ipc'

/** Dữ liệu người dùng nhập thêm cho môn (không thuộc CourseConfig của core). */
export interface CourseMetaInput {
  lop?: string
  giangVien?: string
}

// Default business rules from QĐ450
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  hp_method: 'QD450',
  nguong_dat_clo: 4.0,
  nguong_dat_plo: 4.0,
  nguong_dat_hp: 4.0,
  clo_bo_phan: 'mean_of_ratios',
  rounding_mode: 'chain',
  tinh_sv_vang_thi: true,
  canh_bao_cc_don_le: true,
  ty_le_nhom_27: 0.27,
  nguong_co_mau_n: 30,
  ty_le_dat_clo_canh_bao: 50
}

const DEFAULT_ATTENDANCE_RULES: AttendanceRule[] = [
  { kyHieu: 'V', heSo: 0, dienGiai: 'Vắng không phép' },
  { kyHieu: 'P', heSo: 1, dienGiai: 'Có phép' },
  { kyHieu: 'K', heSo: 1, dienGiai: 'Không tính' }
]

const ASSESSMENT_GROUPS: { value: 'CC' | 'GK' | 'CK'; label: string }[] = [
  { value: 'CC', label: 'Chuyên cần (CC)' },
  { value: 'GK', label: 'Giữa kỳ (GK)' },
  { value: 'CK', label: 'Cuối kỳ (CK)' }
]

const QUESTION_TYPES: { value: 'TL' | 'TN'; label: string }[] = [
  { value: 'TL', label: 'Tự luận (TL)' },
  { value: 'TN', label: 'Trắc nghiệm (TN)' }
]

const EXAM_FORMATS = ['Tự luận', 'Trắc nghiệm']

/* ============================================================
   Kiểu mở rộng: mỗi dòng có _id ổn định để React không remount khi sửa nội dung.
   _id bị loại bỏ khi lưu (serialize) — không lọt vào CourseConfig.
   ============================================================ */

interface EditorClo extends CLODefinition {
  _id: string
}
interface EditorPlan extends EvaluationPlanItem {
  _id: string
}
interface EditorQuestion extends QuestionColumn {
  _id: string
}
interface EditorPlo extends PLOMapping {
  _id: string
}

interface EditorConfig {
  courseInfo: CourseInfo
  cloList: EditorClo[]
  keHoachDanhGia: EditorPlan[]
  cauHoi: EditorQuestion[]
  maTranPlo: EditorPlo[]
  diemDanh?: AttendanceRule[]
  quyTac: BusinessRules
}

interface CourseConfigEditorProps {
  session: SessionDto
  onSave: (config: CourseConfig, meta: CourseMetaInput) => void
}

/** Key lưu cấu hình tạm cho mỗi môn (Phase 2 sẽ thay bằng IPC). */
export function courseConfigKey(sessionId: string): string {
  return `course-config-${sessionId}`
}

interface StoredConfig {
  config: CourseConfig
  meta?: CourseMetaInput
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function sumWeights(items: { trongSoPhanTram: number }[]): number {
  return items.reduce((sum, item) => sum + (item.trongSoPhanTram || 0), 0)
}

function sumCloWeights(cloList: CLODefinition[]): number {
  return cloList.reduce((sum, clo) => sum + (clo.trongSoClo || 1), 0)
}

function getMaxScoreByExamCode(config: CourseConfig): Record<string, number> {
  const result: Record<string, number> = {}
  for (const q of config.cauHoi) {
    const key = `${q.maDauDiem}|${q.maDe || 'ALL'}`
    result[key] = (result[key] || 0) + q.diemToiDa
  }
  return result
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

/** Gắn _id cho các dòng đọc từ JSON (dữ liệu cũ có thể thiếu). */
function withIds(config: CourseConfig): EditorConfig {
  return {
    ...config,
    cloList: (config.cloList ?? []).map((c) => ({ ...c, _id: generateId() })),
    keHoachDanhGia: (config.keHoachDanhGia ?? []).map((p) => ({ ...p, _id: generateId() })),
    cauHoi: (config.cauHoi ?? []).map((q) => ({ ...q, _id: generateId() })),
    maTranPlo: (config.maTranPlo ?? []).map((m) => ({ ...m, _id: generateId() })),
    diemDanh: config.diemDanh ?? DEFAULT_ATTENDANCE_RULES,
    quyTac: config.quyTac ?? DEFAULT_BUSINESS_RULES
  }
}

/** Bỏ _id trước khi lưu/đưa vào core engine. */
function stripId<T extends { _id: string }>(row: T): Omit<T, '_id'> {
  const copy: Record<string, unknown> = { ...row }
  delete copy._id
  return copy as Omit<T, '_id'>
}

function toCourseConfig(editor: EditorConfig): CourseConfig {
  return {
    courseInfo: editor.courseInfo,
    cloList: editor.cloList.map(stripId),
    keHoachDanhGia: editor.keHoachDanhGia.map(stripId),
    cauHoi: editor.cauHoi.map(stripId),
    maTranPlo: editor.maTranPlo.map(stripId),
    diemDanh: editor.diemDanh,
    quyTac: editor.quyTac
  }
}

/** Đọc cấu hình đã lưu tạm trong sessionStorage (nếu có). */
function loadStored(sessionId: string): StoredConfig | null {
  const saved = sessionStorage.getItem(courseConfigKey(sessionId))
  if (!saved) return null
  try {
    return JSON.parse(saved) as StoredConfig
  } catch {
    return null
  }
}

export function CourseConfigEditor({
  session,
  onSave
}: CourseConfigEditorProps): React.ReactElement {
  const stored = useMemo(() => loadStored(session.id), [session.id])

  const [config, setConfig] = useState<EditorConfig>(() =>
    stored ? withIds(stored.config) : defaultConfig(session)
  )
  const [meta, setMeta] = useState<CourseMetaInput>(() => ({
    lop: stored?.meta?.lop ?? session.lop,
    giangVien: stored?.meta?.giangVien ?? session.giangVien
  }))

  useEffect(() => {
    let active = true
    if (window.api?.getCourseConfig) {
      window.api.getCourseConfig(session.id).then((saved) => {
        if (!active || !saved?.config) return
        setConfig(withIds(saved.config))
        if (saved.meta) {
          setMeta({
            lop: saved.meta.lop ?? session.lop,
            giangVien: saved.meta.giangVien ?? session.giangVien
          })
        }
      })
    }
    return () => {
      active = false
    }
  }, [session.id, session.lop, session.giangVien])

  const [activeTab, setActiveTab] = useState('info-clo')
  const [saving, setSaving] = useState(false)

  const cloCodes = selectableCloCode(config.cloList)

  // Validation - derived state from config
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    // Trọng số CLO chỉ có nghĩa với học phần thực hành (QĐ450 Điều 9.3)
    if (config.courseInfo.loaiHp === 'thuc_hanh') {
      const totalCloWeight = sumCloWeights(config.cloList)
      if (config.cloList.length > 0 && Math.abs(totalCloWeight - 100) > 0.01) {
        errors.push(`Tổng trọng số CLO = ${totalCloWeight.toFixed(2)}% (phải bằng 100%)`)
      }
    }

    const totalPlanWeight = sumWeights(config.keHoachDanhGia)
    if (config.keHoachDanhGia.length > 0 && Math.abs(totalPlanWeight - 100) > 0.01) {
      errors.push(`Tổng trọng số kế hoạch = ${totalPlanWeight.toFixed(2)}% (phải bằng 100%)`)
    }

    const maxScores = getMaxScoreByExamCode(config)
    for (const [key, score] of Object.entries(maxScores)) {
      if (Math.abs(score - 10) > 0.01) {
        const [maDauDiem, maDe] = key.split('|')
        errors.push(`Đề "${maDe}" của "${maDauDiem}": tổng điểm tối đa = ${score} (phải bằng 10)`)
      }
    }

    if (config.cloList.length === 0) errors.push('Chưa có CLO nào')
    if (config.keHoachDanhGia.length === 0) errors.push('Chưa có thành phần đánh giá nào')

    return errors
  }, [config])

  const isValid = validationErrors.length === 0

  const handleSave = async (): Promise<void> => {
    if (!isValid) return
    setSaving(true)
    try {
      const serialized = toCourseConfig(config)
      if (window.api?.saveCourseConfig) {
        await window.api.saveCourseConfig(session.id, { config: serialized, meta })
      }
      sessionStorage.setItem(
        courseConfigKey(session.id),
        JSON.stringify({ config: serialized, meta })
      )
      onSave(serialized, meta)
    } finally {
      setSaving(false)
    }
  }

  const handleExportRawTemplate = async (): Promise<void> => {
    const serialized = toCourseConfig(config)
    if (window.api?.exportRawGradesTemplate) {
      const res = await window.api.exportRawGradesTemplate(serialized)
      if (res.ok && res.path) {
        alert(`Đã xuất file Template điểm thô:\n${res.path}`)
      } else if (res.error) {
        alert(`Lỗi xuất file: ${res.error}`)
      }
    }
  }

  const handleExportJson = (): void => {
    const json = JSON.stringify({ config: toCourseConfig(config), meta }, null, 2)
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
        const parsed = JSON.parse(e.target?.result as string) as StoredConfig | CourseConfig
        const cfg = 'config' in parsed ? parsed.config : parsed
        setConfig(withIds(cfg))
        if ('meta' in parsed && parsed.meta) setMeta(parsed.meta)
      } catch {
        alert('File JSON không hợp lệ')
      }
    }
    reader.readAsText(file)
  }

  const patchCourseInfo = (patch: Partial<CourseInfo>): void =>
    setConfig((c) => ({ ...c, courseInfo: { ...c.courseInfo, ...patch } }))

  // ===================== TAB 1: THÔNG TIN & CLO =====================
  const renderTab1 = (): React.ReactElement => (
    <TabsContent value="info-clo" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Thông tin học phần</CardTitle>
          <CardDescription>Dùng để nhận diện môn trong toàn bộ ứng dụng</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="maHp">Mã học phần *</Label>
            <Input
              id="maHp"
              value={config.courseInfo.maHp}
              onChange={(e) => patchCourseInfo({ maHp: e.target.value.toUpperCase() })}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="tenHp">Tên môn học *</Label>
            <Input
              id="tenHp"
              value={config.courseInfo.tenHp}
              onChange={(e) => patchCourseInfo({ tenHp: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="soTinChi">Số tín chỉ *</Label>
            <Input
              id="soTinChi"
              type="number"
              min="1"
              step="1"
              value={config.courseInfo.soTinChi}
              onChange={(e) => patchCourseInfo({ soTinChi: Number(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hinhThucThi">Hình thức thi</Label>
            <Select
              value={config.courseInfo.hinhThucThi}
              onValueChange={(v) => patchCourseInfo({ hinhThucThi: v })}
            >
              <SelectTrigger id="hinhThucThi" className="mt-1 w-full">
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
          </div>
          <div>
            <Label htmlFor="loaiHp">Loại học phần</Label>
            <Select
              value={config.courseInfo.loaiHp}
              onValueChange={(v) => patchCourseInfo({ loaiHp: v as 'thuong' | 'thuc_hanh' })}
            >
              <SelectTrigger id="loaiHp" className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thuong">Thường</SelectItem>
                <SelectItem value="thuc_hanh">Thực hành</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lop">Lớp</Label>
            <Input
              id="lop"
              value={meta.lop ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, lop: e.target.value }))}
              className="mt-1"
              placeholder="VD: D21-1"
            />
          </div>
          <div>
            <Label htmlFor="giangVien">Giảng viên</Label>
            <Input
              id="giangVien"
              value={meta.giangVien ?? ''}
              onChange={(e) => setMeta((m) => ({ ...m, giangVien: e.target.value }))}
              className="mt-1"
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
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
                  {config.cloList.map((clo, index) => (
                    <TableRow key={clo._id}>
                      <TableCell className="text-muted-foreground text-center">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <Input
                          value={clo.maClo}
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
                            value={clo.trongSoClo ?? 1}
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
                  ))}
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
    </TabsContent>
  )

  // ===================== TAB 2: KẾ HOẠCH & ĐỀ THI =====================
  const renderTab2 = (): React.ReactElement => (
    <TabsContent value="plan-exam" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Kế hoạch đánh giá &amp; Cấu trúc đề</CardTitle>
            <CardDescription>
              Cấu hình từng đầu điểm kèm bảng ma trận câu hỏi - CLO - điểm tối đa theo từng mã đề
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setConfig((c) => ({
                ...c,
                keHoachDanhGia: [
                  ...c.keHoachDanhGia,
                  {
                    _id: generateId(),
                    nhom: 'CC',
                    thanhPhan: '',
                    maDauDiem: '',
                    clo: '',
                    trongSoPhanTram: 0,
                    hinhThuc: ''
                  }
                ]
              }))
            }
          >
            <Plus className="mr-1 size-4" /> Thêm đầu điểm
          </Button>
        </CardHeader>
        <CardContent>
          {config.keHoachDanhGia.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Chưa có thành phần đánh giá.
            </p>
          ) : (
            <div className="space-y-6">
              {config.keHoachDanhGia.map((item) => {
                const questionsForItem = config.cauHoi.filter((q) => q.maDauDiem === item.maDauDiem)
                const examCodes = [
                  'ALL',
                  ...new Set(
                    questionsForItem.map((q) => q.maDe || 'ALL').filter((d) => d !== 'ALL')
                  )
                ]

                const patchPlan = (patch: Partial<EditorPlan>): void =>
                  setConfig((c) => ({
                    ...c,
                    keHoachDanhGia: c.keHoachDanhGia.map((x) =>
                      x._id === item._id ? { ...x, ...patch } : x
                    )
                  }))

                return (
                  <Card key={item._id} className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <Select
                            value={item.nhom}
                            onValueChange={(v) => patchPlan({ nhom: v as 'CC' | 'GK' | 'CK' })}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSESSMENT_GROUPS.map((g) => (
                                <SelectItem key={g.value} value={g.value}>
                                  {g.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Tên thành phần (VD: Chuyên cần, Giữa kỳ 1...)"
                            value={item.thanhPhan}
                            onChange={(e) => patchPlan({ thanhPhan: e.target.value })}
                            className="w-48 text-sm"
                          />
                          <Input
                            placeholder="Mã đầu điểm (VD: CC, GK1, CK)"
                            value={item.maDauDiem}
                            onChange={(e) => patchPlan({ maDauDiem: e.target.value.toUpperCase() })}
                            className="w-32 font-mono text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Trọng số %"
                            value={item.trongSoPhanTram}
                            onChange={(e) =>
                              patchPlan({ trongSoPhanTram: Number(e.target.value) || 0 })
                            }
                            className="w-24 text-right font-mono text-sm"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfig((c) => ({
                                ...c,
                                keHoachDanhGia: c.keHoachDanhGia.filter((x) => x._id !== item._id)
                              }))
                            }
                          >
                            <Trash2 className="text-destructive size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* CLO mapping */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="text-muted-foreground shrink-0 text-sm">
                          CLO liên kết:
                        </Label>
                        <Select
                          value={item.clo || undefined}
                          onValueChange={(v) => patchPlan({ clo: v })}
                          disabled={cloCodes.length === 0}
                        >
                          <SelectTrigger className="w-40">
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
                        <Input
                          placeholder="Hình thức (VD: Bài tập, Thi viết, Trắc nghiệm...)"
                          value={item.hinhThuc || ''}
                          onChange={(e) => patchPlan({ hinhThuc: e.target.value })}
                          className="min-w-[200px] flex-1 text-sm"
                        />
                      </div>

                      {/* Question matrix for GK/CK */}
                      {['GK', 'CK'].includes(item.nhom) && item.maDauDiem && (
                        <div className="border-border/50 space-y-3 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              Ma trận câu hỏi - Mã đầu điểm: {item.maDauDiem}
                            </h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setConfig((c) => ({
                                  ...c,
                                  cauHoi: [
                                    ...c.cauHoi,
                                    {
                                      _id: generateId(),
                                      maCotDiem: '',
                                      maDauDiem: item.maDauDiem,
                                      cau: `Câu ${questionsForItem.filter((q) => (q.maDe || 'ALL') === 'ALL').length + 1}`,
                                      clo: cloCodes[0] || '',
                                      diemToiDa: 0,
                                      maDe: 'ALL',
                                      loai: 'TL'
                                    }
                                  ]
                                }))
                              }
                            >
                              <Plus className="mr-1 size-4" /> Thêm câu hỏi (mã đề ALL)
                            </Button>
                          </div>

                          <Tabs defaultValue="ALL" className="space-y-3">
                            <TabsList>
                              {examCodes.map((de) => (
                                <TabsTrigger key={de} value={de} className="px-2 py-1 text-xs">
                                  {de === 'ALL' ? 'Chung (ALL)' : `Đề ${de}`}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                            {examCodes.map((de) => {
                              const questions = questionsForItem.filter(
                                (q) => (q.maDe || 'ALL') === de
                              )
                              const maxScore = questions.reduce((sum, q) => sum + q.diemToiDa, 0)
                              const isValidScore = Math.abs(maxScore - 10) < 0.01

                              return (
                                <TabsContent key={de} value={de} className="space-y-2">
                                  <div
                                    className={cn(
                                      'flex items-center gap-2 text-xs font-medium',
                                      isValidScore ? 'text-success' : 'text-destructive'
                                    )}
                                  >
                                    <span>Tổng điểm tối đa đề này: {maxScore.toFixed(1)} / 10</span>
                                    {isValidScore ? (
                                      <CheckCircle className="size-4" />
                                    ) : (
                                      <AlertCircle className="size-4" />
                                    )}
                                  </div>
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="w-10">STT</TableHead>
                                          <TableHead className="w-28">Mã cột điểm</TableHead>
                                          <TableHead className="w-28">Câu</TableHead>
                                          <TableHead className="w-28">CLO</TableHead>
                                          <TableHead className="w-24">Điểm tối đa</TableHead>
                                          <TableHead className="w-32">Loại</TableHead>
                                          <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {questions.length === 0 ? (
                                          <TableRow>
                                            <TableCell
                                              colSpan={7}
                                              className="text-muted-foreground py-4 text-center"
                                            >
                                              Chưa có câu hỏi. Bấm "Thêm câu hỏi" để bắt đầu.
                                            </TableCell>
                                          </TableRow>
                                        ) : (
                                          questions.map((q, qIdx) => {
                                            const patchQ = (patch: Partial<EditorQuestion>): void =>
                                              setConfig((c) => ({
                                                ...c,
                                                cauHoi: c.cauHoi.map((x) =>
                                                  x._id === q._id ? { ...x, ...patch } : x
                                                )
                                              }))
                                            return (
                                              <TableRow key={q._id}>
                                                <TableCell className="text-muted-foreground text-center">
                                                  {qIdx + 1}
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={q.maCotDiem}
                                                    onChange={(e) =>
                                                      patchQ({ maCotDiem: e.target.value })
                                                    }
                                                    className="font-mono text-sm"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Input
                                                    value={q.cau}
                                                    onChange={(e) =>
                                                      patchQ({ cau: e.target.value })
                                                    }
                                                    className="font-mono text-sm"
                                                    placeholder="VD: Câu 1a"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Select
                                                    value={q.clo || undefined}
                                                    onValueChange={(v) => patchQ({ clo: v })}
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
                                                <TableCell>
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={q.diemToiDa}
                                                    onChange={(e) =>
                                                      patchQ({
                                                        diemToiDa: Number(e.target.value) || 0
                                                      })
                                                    }
                                                    className="w-20 text-right font-mono text-sm"
                                                  />
                                                </TableCell>
                                                <TableCell>
                                                  <Select
                                                    value={q.loai || 'TL'}
                                                    onValueChange={(v) =>
                                                      patchQ({ loai: v as 'TL' | 'TN' })
                                                    }
                                                  >
                                                    <SelectTrigger className="w-full">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {QUESTION_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                          {t.label}
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
                                                        cauHoi: c.cauHoi.filter(
                                                          (x) => x._id !== q._id
                                                        )
                                                      }))
                                                    }
                                                  >
                                                    <Trash2 className="text-destructive size-4" />
                                                  </Button>
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setConfig((c) => ({
                                        ...c,
                                        cauHoi: [
                                          ...c.cauHoi,
                                          {
                                            _id: generateId(),
                                            maCotDiem: '',
                                            maDauDiem: item.maDauDiem,
                                            cau: `Câu ${questions.length + 1}`,
                                            clo: cloCodes[0] || '',
                                            diemToiDa: 0,
                                            maDe: de,
                                            loai: 'TL'
                                          }
                                        ]
                                      }))
                                    }
                                  >
                                    <Plus className="mr-1 size-4" /> Thêm câu hỏi vào đề{' '}
                                    {de === 'ALL' ? '(chung)' : de}
                                  </Button>
                                </TabsContent>
                              )
                            })}
                          </Tabs>
                        </div>
                      )}

                      {/* CC items - direct score column */}
                      {item.nhom === 'CC' && item.maDauDiem && (
                        <div className="border-border/50 space-y-3 border-t pt-4">
                          <h4 className="text-sm font-medium">
                            Cột điểm trực tiếp (Chuyên cần - thang 10)
                          </h4>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-10">STT</TableHead>
                                  <TableHead className="w-28">Mã cột điểm</TableHead>
                                  <TableHead className="w-40">Tên cột</TableHead>
                                  <TableHead className="w-28">CLO</TableHead>
                                  <TableHead className="w-24">Điểm tối đa</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {questionsForItem.length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="text-muted-foreground py-4 text-center"
                                    >
                                      Chưa có cột điểm. Bấm nút bên dưới để thêm.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  questionsForItem.map((q, qIdx) => {
                                    const patchQ = (patch: Partial<EditorQuestion>): void =>
                                      setConfig((c) => ({
                                        ...c,
                                        cauHoi: c.cauHoi.map((x) =>
                                          x._id === q._id ? { ...x, ...patch } : x
                                        )
                                      }))
                                    return (
                                      <TableRow key={q._id}>
                                        <TableCell className="text-muted-foreground text-center">
                                          {qIdx + 1}
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={q.maCotDiem}
                                            onChange={(e) => patchQ({ maCotDiem: e.target.value })}
                                            className="font-mono text-sm"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={q.cau}
                                            onChange={(e) => patchQ({ cau: e.target.value })}
                                            className="text-sm"
                                            placeholder="VD: Điểm chuyên cần"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Select
                                            value={q.clo || undefined}
                                            onValueChange={(v) => patchQ({ clo: v })}
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
                                        <TableCell>
                                          <Input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={q.diemToiDa}
                                            onChange={(e) =>
                                              patchQ({ diemToiDa: Number(e.target.value) || 0 })
                                            }
                                            className="w-20 text-right font-mono text-sm"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              setConfig((c) => ({
                                                ...c,
                                                cauHoi: c.cauHoi.filter((x) => x._id !== q._id)
                                              }))
                                            }
                                          >
                                            <Trash2 className="text-destructive size-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setConfig((c) => ({
                                ...c,
                                cauHoi: [
                                  ...c.cauHoi,
                                  {
                                    _id: generateId(),
                                    maCotDiem: '',
                                    maDauDiem: item.maDauDiem,
                                    cau: `CC ${questionsForItem.length + 1}`,
                                    clo: cloCodes[0] || '',
                                    diemToiDa: 10,
                                    maDe: 'ALL',
                                    loai: 'TL'
                                  }
                                ]
                              }))
                            }
                          >
                            <Plus className="mr-1 size-4" /> Thêm cột điểm CC
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
          {config.keHoachDanhGia.length > 0 && (
            <div
              className={cn(
                'mt-4 flex items-center gap-2 text-sm',
                Math.abs(sumWeights(config.keHoachDanhGia) - 100) < 0.01
                  ? 'text-success'
                  : 'text-destructive'
              )}
            >
              <CheckCircle className="size-4" />
              <span>Tổng trọng số kế hoạch: {sumWeights(config.keHoachDanhGia).toFixed(2)}%</span>
              {Math.abs(sumWeights(config.keHoachDanhGia) - 100) >= 0.01 && (
                <AlertCircle className="size-4" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
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
                    return (
                      <TableRow key={mapping._id}>
                        <TableCell className="text-muted-foreground text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={mapping.plo}
                            onChange={(e) => patchPlo({ plo: e.target.value.toUpperCase() })}
                            className="font-mono text-sm"
                            placeholder="VD: PLO1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={mapping.pi}
                            onChange={(e) => patchPlo({ pi: e.target.value.toUpperCase() })}
                            className="font-mono text-sm"
                            placeholder="VD: PI1.1"
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
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="size-4" />
          <AlertDescription className="space-y-1">
            <strong>Cấu hình chưa hợp lệ:</strong>
            <ul className="ml-2 list-inside list-disc text-sm">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={saving ? 'default' : 'outline'}
            onClick={handleSave}
            disabled={saving || !isValid}
          >
            <Save className="mr-1 size-4" />
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportRawTemplate}
            disabled={!isValid}
            title={isValid ? 'Xuất file Excel mẫu để giảng viên nhập điểm' : 'Cần sửa các lỗi cấu hình trước khi xuất mẫu'}
          >
            <FileSpreadsheet className="mr-1 size-4" />
            Xuất mẫu điểm thô (.xlsx)
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
        </div>
        <div className="text-muted-foreground text-xs">
          Môn: <span className="font-mono font-medium">{session.maHp}</span> - {session.courseName}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info-clo">1. Thông tin &amp; CLO</TabsTrigger>
          <TabsTrigger value="plan-exam">2. Kế hoạch &amp; Đề thi</TabsTrigger>
          <TabsTrigger value="plo">3. Ma trận PLO</TabsTrigger>
        </TabsList>
        {renderTab1()}
        {renderTab2()}
        {renderTab3()}
      </Tabs>
    </div>
  )
}
