/**
 * Wizard nhập kế hoạch đánh giá theo TỪNG ĐỢT (đầu điểm).
 *
 * Thay vì nhập từng dòng (đầu điểm, CLO) phải gõ lại mã đầu điểm nhiều lần,
 * wizard gom mọi thứ theo đợt: người dùng chỉ cần khai báo Nhóm, Tên thành phần,
 * Trọng số đợt, các CLO được đo và danh sách câu hỏi. Mã đầu điểm (VD: GK1) và
 * mã cột điểm (VD: GK1_C01) do app tự sinh, chỉ hiển thị để đối chiếu file điểm thô.
 */
import React, { useState } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs'
import { AlertCircle, CheckCircle, Plus, Sparkles, Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { roundHalfUp } from '@core/rules'
import type { EditorConfig, EditorPlan, EditorQuestion } from './course-editor-types'
import { ASSESSMENT_GROUPS, QUESTION_TYPES } from './course-editor-types'

interface PlanWizardProps {
  config: EditorConfig
  setConfig: React.Dispatch<React.SetStateAction<EditorConfig>>
  cloCodes: string[]
}

/** Một đợt đánh giá = một mã đầu điểm, gom các dòng kế hoạch (mỗi CLO một dòng) + câu hỏi. */
interface Dot {
  maDauDiem: string
  nhom: 'CC' | 'GK' | 'CK'
  thanhPhan: string
  hinhThuc: string
  cachNhapDiem: 'QUESTION_SCORE' | 'DIRECT_CLO_SCORE' | 'ATTENDANCE'
  rows: EditorPlan[]
  questions: EditorQuestion[]
}

function groupDots(config: EditorConfig): Dot[] {
  const byCode = new Map<string, Dot>()
  for (const row of config.keHoachDanhGia) {
    const defaultMode = row.nhom === 'CC' ? 'ATTENDANCE' : 'QUESTION_SCORE'
    const cachNhapDiem = row.cachNhapDiem ?? defaultMode

    if (row.clo === '__PLACEHOLDER__') {
      if (!byCode.has(row.maDauDiem)) {
        byCode.set(row.maDauDiem, {
          maDauDiem: row.maDauDiem,
          nhom: row.nhom,
          thanhPhan: row.thanhPhan,
          hinhThuc: row.hinhThuc || '',
          cachNhapDiem,
          rows: [],
          questions: []
        })
      }
      continue
    }
    let dot = byCode.get(row.maDauDiem)
    if (!dot) {
      dot = {
        maDauDiem: row.maDauDiem,
        nhom: row.nhom,
        thanhPhan: row.thanhPhan,
        hinhThuc: row.hinhThuc || '',
        cachNhapDiem,
        rows: [],
        questions: []
      }
      byCode.set(row.maDauDiem, dot)
    }
    dot.rows.push(row)
  }
  for (const q of config.cauHoi) {
    byCode.get(q.maDauDiem)?.questions.push(q)
  }
  return [...byCode.values()]
}

/** Mã đầu điểm tiếp theo theo nhóm, bảo đảm không trùng (GK1, GK2, ...). */
function nextDauDiemCode(used: Set<string>, nhom: 'CC' | 'GK' | 'CK'): string {
  let i = 1
  while (used.has(`${nhom}${i}`)) i++
  return `${nhom}${i}`
}

/** Mã cột điểm tiếp theo của một đầu điểm, bảo đảm duy nhất toàn cấu hình (GK1_C01, ...). */
function nextCotDiemCode(config: EditorConfig, maDauDiem: string): string {
  const used = new Set(config.cauHoi.map((q) => q.maCotDiem))
  let i = 1
  const code = (): string => `${maDauDiem}_C${String(i).padStart(2, '0')}`
  while (used.has(code())) i++
  return code()
}

export function PlanWizard({ config, setConfig, cloCodes }: PlanWizardProps): React.ReactElement {
  const dots = groupDots(config)
  const [cloPickerNonce, setCloPickerNonce] = useState(0)
  // Giữ mã đề chưa có câu hỏi nào; nếu chỉ suy ra từ cauHoi thì tab mới biến mất ngay.
  const [extraExamCodes, setExtraExamCodes] = useState<Record<string, string[]>>({})

  /** Thêm đợt mới: sinh mã đầu điểm tự động, thêm placeholder vào state để hiện card. */
  const addDot = (nhom: 'CC' | 'GK' | 'CK'): void => {
    setConfig((c) => {
      const used = new Set(c.keHoachDanhGia.map((p) => p.maDauDiem).filter(Boolean))
      const maDauDiem = nextDauDiemCode(used, nhom)
      const cachNhapDiem = nhom === 'CC' ? 'ATTENDANCE' : 'QUESTION_SCORE'
      return {
        ...c,
        keHoachDanhGia: [
          ...c.keHoachDanhGia,
          {
            _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
            nhom,
            thanhPhan: '',
            maDauDiem,
            clo: '__PLACEHOLDER__',
            trongSoPhanTram: 0,
            hinhThuc: '',
            cachNhapDiem
          }
        ]
      }
    })
  }

  /** Xóa cả đợt: các dòng kế hoạch + câu hỏi thuộc đầu điểm đó. */
  const deleteDot = (dot: Dot): void => {
    setConfig((c) => ({
      ...c,
      keHoachDanhGia: c.keHoachDanhGia.filter((p) => p.maDauDiem !== dot.maDauDiem),
      cauHoi: c.cauHoi.filter((q) => q.maDauDiem !== dot.maDauDiem)
    }))
  }

  /** Sửa thông tin chung của đợt áp lên mọi dòng kế hoạch của đợt. */
  const patchDot = (
    dot: Dot,
    patch: Partial<Pick<EditorPlan, 'nhom' | 'thanhPhan' | 'hinhThuc' | 'cachNhapDiem'>>
  ): void => {
    setConfig((c) => ({
      ...c,
      keHoachDanhGia: c.keHoachDanhGia.map((p) =>
        p.maDauDiem === dot.maDauDiem ? { ...p, ...patch } : p
      )
    }))
  }

  /** Thêm CLO vào đợt (tạo dòng kế hoạch mới với trọng số 0). */
  const addCloToDot = (dot: Dot, clo: string): void => {
    setConfig((c) => ({
      ...c,
      keHoachDanhGia: [
        ...c.keHoachDanhGia.filter(
          (p) => !(p.maDauDiem === dot.maDauDiem && p.clo === '__PLACEHOLDER__')
        ),
        {
          _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
          nhom: dot.nhom,
          thanhPhan: dot.thanhPhan,
          maDauDiem: dot.maDauDiem,
          clo,
          trongSoPhanTram: 0,
          hinhThuc: dot.hinhThuc,
          cachNhapDiem: dot.cachNhapDiem
        }
      ]
    }))
  }

  /** Xóa một CLO khỏi đợt: bỏ dòng kế hoạch và câu hỏi đo CLO đó ở đợt này. */
  const removeCloFromDot = (dot: Dot, clo: string): void => {
    setConfig((c) => {
      const remaining = c.keHoachDanhGia.filter(
        (p) => !(p.maDauDiem === dot.maDauDiem && p.clo === clo)
      )
      const hasRows = remaining.some(
        (p) => p.maDauDiem === dot.maDauDiem && p.clo !== '__PLACEHOLDER__'
      )
      return {
        ...c,
        // Giữ card đợt khi CLO cuối bị xóa, nhưng không giữ CLO giả trong bảng.
        keHoachDanhGia: hasRows
          ? remaining
          : [
              ...remaining,
              {
                _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
                nhom: dot.nhom,
                thanhPhan: dot.thanhPhan,
                maDauDiem: dot.maDauDiem,
                clo: '__PLACEHOLDER__',
                trongSoPhanTram: 0,
                hinhThuc: dot.hinhThuc
              }
            ],
        cauHoi: c.cauHoi.filter((q) => !(q.maDauDiem === dot.maDauDiem && q.clo === clo))
      }
    })
  }

  /** Đặt trọng số cho đợt: phân bổ theo điểm câu hỏi nếu có, hoặc chia đều (cho phép số thập phân). */
  const setDotTotalWeight = (dot: Dot, total: number): void => {
    const n = dot.rows.length
    if (n === 0 || !Number.isFinite(total) || total < 0) return

    // Tính điểm câu hỏi theo từng CLO nếu có câu hỏi
    const questions = dot.questions
    const cloScores: Record<string, number> = {}
    let totalQScore = 0
    for (const q of questions) {
      if (q.clo && q.diemToiDa > 0) {
        cloScores[q.clo] = (cloScores[q.clo] || 0) + q.diemToiDa
        totalQScore += q.diemToiDa
      }
    }

    setConfig((c) => {
      const dotRows = c.keHoachDanhGia.filter((p) => p.maDauDiem === dot.maDauDiem)
      let allocated = 0

      return {
        ...c,
        keHoachDanhGia: c.keHoachDanhGia.map((p) => {
          if (p.maDauDiem !== dot.maDauDiem) return p
          const rowIdx = dotRows.findIndex((r) => r._id === p._id)
          const isLast = rowIdx === dotRows.length - 1

          let w = 0
          if (totalQScore > 0) {
            if (isLast) {
              w = roundHalfUp(total - allocated, 2)
            } else {
              const qScore = cloScores[p.clo] || 0
              w = roundHalfUp((qScore / totalQScore) * total, 2)
              allocated += w
            }
          } else {
            if (isLast) {
              w = roundHalfUp(total - allocated, 2)
            } else {
              w = roundHalfUp(total / dotRows.length, 2)
              allocated += w
            }
          }
          return { ...p, trongSoPhanTram: w }
        })
      }
    })
  }

  /** Đồng bộ phân bổ trọng số CLO theo điểm tối đa câu hỏi của đợt. */
  const syncWeightsFromQuestions = (dot: Dot): void => {
    const totalWeight = dot.rows.reduce((sum, r) => sum + (r.trongSoPhanTram || 0), 0)
    setDotTotalWeight(dot, totalWeight)
  }

  const patchCloWeight = (rowId: string, weight: number): void => {
    setConfig((c) => ({
      ...c,
      keHoachDanhGia: c.keHoachDanhGia.map((p) =>
        p._id === rowId ? { ...p, trongSoPhanTram: weight } : p
      )
    }))
  }

  /** Thêm câu hỏi/cột điểm vào đợt; mã cột điểm tự sinh, duy nhất toàn cấu hình. */
  const addQuestion = (dot: Dot, maDe: string): void => {
    setConfig((c) => {
      const existing = c.cauHoi.filter((q) => q.maDauDiem === dot.maDauDiem)
      const isCc = dot.nhom === 'CC'
      const cau = isCc
        ? `CC ${existing.length + 1}`
        : `Câu ${existing.filter((q) => (q.maDe || 'ALL') === maDe).length + 1}`
      // CLO mặc định: lấy từ CLO đầu tiên được đo ở đợt này, không phải toàn bộ cloCodes
      const defaultClo = dot.rows[0]?.clo ?? c.cloList[0]?.maClo ?? ''

      let nextPlan = c.keHoachDanhGia
      if (
        defaultClo &&
        !nextPlan.some((p) => p.maDauDiem === dot.maDauDiem && p.clo === defaultClo)
      ) {
        nextPlan = [
          ...nextPlan.filter((p) => !(p.maDauDiem === dot.maDauDiem && p.clo === '__PLACEHOLDER__')),
          {
            _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
            nhom: dot.nhom,
            thanhPhan: dot.thanhPhan,
            maDauDiem: dot.maDauDiem,
            clo: defaultClo,
            trongSoPhanTram: 0,
            hinhThuc: dot.hinhThuc,
            cachNhapDiem: dot.cachNhapDiem
          }
        ]
      }

      return {
        ...c,
        keHoachDanhGia: nextPlan,
        cauHoi: [
          ...c.cauHoi,
          {
            _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
            maCotDiem: nextCotDiemCode(c, dot.maDauDiem),
            maDauDiem: dot.maDauDiem,
            cau,
            clo: defaultClo,
            diemToiDa: isCc ? 10 : 0,
            maDe,
            loai: 'TL'
          }
        ]
      }
    })
  }

  const patchQuestion = (questionId: string, patch: Partial<EditorQuestion>): void => {
    setConfig((c) => {
      const targetQ = c.cauHoi.find((q) => q._id === questionId)
      let nextPlan = c.keHoachDanhGia
      if (targetQ && patch.clo && patch.clo !== targetQ.clo) {
        const dotId = targetQ.maDauDiem
        const hasCloInPlan = nextPlan.some((p) => p.maDauDiem === dotId && p.clo === patch.clo)
        if (!hasCloInPlan) {
          const dotPlan = nextPlan.find((p) => p.maDauDiem === dotId)
          nextPlan = [
            ...nextPlan.filter((p) => !(p.maDauDiem === dotId && p.clo === '__PLACEHOLDER__')),
            {
              _id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
              nhom: dotPlan?.nhom ?? 'GK',
              thanhPhan: dotPlan?.thanhPhan ?? '',
              maDauDiem: dotId,
              clo: patch.clo,
              trongSoPhanTram: 0,
              hinhThuc: dotPlan?.hinhThuc ?? '',
              cachNhapDiem: dotPlan?.cachNhapDiem
            }
          ]
        }
      }
      return {
        ...c,
        keHoachDanhGia: nextPlan,
        cauHoi: c.cauHoi.map((q) => (q._id === questionId ? { ...q, ...patch } : q))
      }
    })
  }

  const deleteQuestion = (questionId: string): void => {
    setConfig((c) => ({ ...c, cauHoi: c.cauHoi.filter((q) => q._id !== questionId) }))
  }

  const addExamCode = (maDauDiem: string, maDe: string): void => {
    setExtraExamCodes((current) => ({
      ...current,
      [maDauDiem]: [...(current[maDauDiem] ?? []), maDe]
    }))
  }

  const deleteExamCode = (maDauDiem: string, maDe: string): void => {
    setExtraExamCodes((current) => ({
      ...current,
      [maDauDiem]: (current[maDauDiem] ?? []).filter((code) => code !== maDe)
    }))
    setConfig((c) => ({
      ...c,
      cauHoi: c.cauHoi.filter((q) => !(q.maDauDiem === maDauDiem && (q.maDe || 'ALL') === maDe))
    }))
  }

  const totalWeight = config.keHoachDanhGia.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
  const weightOk = config.keHoachDanhGia.length > 0 && Math.abs(totalWeight - 100) < 0.01

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Các đợt đánh giá</CardTitle>
        <CardDescription>
          Mỗi đợt là một lần đo (chuyên cần, kiểm tra, thi cuối kỳ...). Mã đầu điểm và mã cột điểm
          được sinh tự động — chỉ cần chọn nhóm, đặt tên, chọn CLO được đo và nhập câu hỏi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dots.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Chưa có đợt đánh giá. Chọn nhóm bên dưới để thêm đợt đầu tiên.
          </p>
        ) : (
          <div className="space-y-6">
            {dots.map((dot) => {
              const dotWeight = dot.rows.reduce((sum, p) => sum + p.trongSoPhanTram, 0)
              const examCodes = [
                'ALL',
                ...new Set([
                  ...dot.questions.map((q) => q.maDe || 'ALL').filter((d) => d !== 'ALL'),
                  ...(extraExamCodes[dot.maDauDiem] ?? [])
                ])
              ]

              return (
                <Card key={dot.maDauDiem} className="border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={dot.nhom}
                          onValueChange={(v) => patchDot(dot, { nhom: v as 'CC' | 'GK' | 'CK' })}
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
                          placeholder="Tên đợt (VD: Kiểm tra giữa kỳ, Chuyên cần...)"
                          value={dot.thanhPhan}
                          onChange={(e) => patchDot(dot, { thanhPhan: e.target.value })}
                          className="w-56 text-sm"
                        />
                        <Input
                          placeholder="Hình thức (VD: Thi viết, Trắc nghiệm...)"
                          value={dot.hinhThuc}
                          onChange={(e) => patchDot(dot, { hinhThuc: e.target.value })}
                          className="w-48 text-sm"
                        />
                        <Select
                          value={dot.cachNhapDiem}
                          onValueChange={(v) =>
                            patchDot(dot, {
                              cachNhapDiem: v as
                                | 'QUESTION_SCORE'
                                | 'DIRECT_CLO_SCORE'
                                | 'ATTENDANCE'
                            })
                          }
                        >
                          <SelectTrigger className="w-48 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUESTION_SCORE">Theo câu hỏi đề thi</SelectItem>
                            <SelectItem value="DIRECT_CLO_SCORE">
                              Điểm trực tiếp (thang 10)
                            </SelectItem>
                            {dot.nhom === 'CC' && (
                              <SelectItem value="ATTENDANCE">Điểm danh theo buổi</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {/* Mã đầu điểm do app sinh — chỉ đọc để đối chiếu file điểm thô */}
                        <span
                          title="Mã đầu điểm được sinh tự động"
                          className="bg-muted rounded px-2 py-1 font-mono text-xs"
                        >
                          {dot.maDauDiem}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteDot(dot)}>
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* CLO được đo + trọng số */}
                    <div className="border-border/50 space-y-2 border-t pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">CLO được đo &amp; trọng số</h4>
                          {dot.questions.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => syncWeightsFromQuestions(dot)}
                              className="h-7 text-xs"
                            >
                              <Sparkles className="mr-1 size-3.5" /> Phân bổ theo điểm câu hỏi
                            </Button>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Label className="text-muted-foreground text-xs">Trọng số đợt:</Label>
                          <Input
                            type="number"
                            min="0"
                            value={dotWeight || ''}
                            placeholder="VD: 30"
                            onChange={(e) => setDotTotalWeight(dot, Number(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="w-24 text-right font-mono text-sm"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                      </div>
                      {dot.rows.length === 0 ? (
                        <p className="text-muted-foreground py-3 text-center text-sm">
                          Chưa có CLO. Chọn CLO từ dropdown bên dưới.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12 text-center">STT</TableHead>
                                <TableHead className="w-40">CLO</TableHead>
                                <TableHead className="w-28 text-right">Trọng số %</TableHead>
                                <TableHead className="w-16"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dot.rows.map((row, idx) => (
                                <TableRow key={row._id}>
                                  <TableCell className="text-muted-foreground text-center">
                                    {idx + 1}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={row.clo || undefined}
                                      onValueChange={(v) =>
                                        setConfig((c) => ({
                                          ...c,
                                          keHoachDanhGia: c.keHoachDanhGia.map((p) =>
                                            p._id === row._id ? { ...p, clo: v } : p
                                          )
                                        }))
                                      }
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
                                  <TableCell className="text-right">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={row.trongSoPhanTram || ''}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        patchCloWeight(row._id, val === '' ? 0 : Number(val))
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="ml-auto w-24 text-right font-mono text-sm"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeCloFromDot(dot, row.clo)}
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
                      {cloCodes.length > 0 && (
                        <Select
                          key={`${dot.maDauDiem}-${cloPickerNonce}`}
                          value={undefined}
                          onValueChange={(v) => {
                            addCloToDot(dot, v)
                            setCloPickerNonce((n) => n + 1)
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="+ Thêm CLO được đo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cloCodes
                              .filter((code) => !dot.rows.some((p) => p.clo === code))
                              .map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Câu hỏi / cột điểm của đợt */}
                    {dot.cachNhapDiem === 'DIRECT_CLO_SCORE' ? (
                      <div className="border-border/50 bg-muted/30 rounded border p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Điểm trực tiếp (thang 10):
                        </span>{' '}
                        File Excel chỉ cần 1 cột điểm có mã{' '}
                        <code className="font-mono font-semibold text-foreground">
                          {dot.maDauDiem}
                        </code>
                        . Điểm cột này tự động gán cho tất cả CLO đã chọn ở trên (
                        {dot.rows.map((r) => r.clo).join(', ')}).
                      </div>
                    ) : dot.cachNhapDiem === 'ATTENDANCE' ? (
                      <div className="border-border/50 bg-muted/30 rounded border p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Điểm danh theo buổi:
                        </span>{' '}
                        Điểm số được tính tự động từ các buổi điểm danh (ký hiệu P, V, M) trong file
                        Excel.
                      </div>
                    ) : dot.nhom === 'CC' ? (
                      <CcColumns
                        dot={dot}
                        cloCodes={cloCodes}
                        addQuestion={addQuestion}
                        patchQuestion={patchQuestion}
                        deleteQuestion={deleteQuestion}
                      />
                    ) : (
                      <ExamQuestions
                        dot={dot}
                        examCodes={examCodes}
                        cloCodes={cloCodes}
                        addQuestion={addQuestion}
                        patchQuestion={patchQuestion}
                        deleteQuestion={deleteQuestion}
                        addExamCode={addExamCode}
                        deleteExamCode={deleteExamCode}
                      />
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Thêm đợt nhanh theo nhóm */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">Thêm đợt:</span>
          {ASSESSMENT_GROUPS.map((g) => (
            <Button key={g.value} size="sm" variant="outline" onClick={() => addDot(g.value)}>
              <Plus className="mr-1 size-4" /> {g.label}
            </Button>
          ))}
        </div>

        {config.keHoachDanhGia.length > 0 && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm',
              weightOk ? 'text-success' : 'text-destructive'
            )}
          >
            {weightOk ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
            <span>Tổng trọng số kế hoạch: {totalWeight.toFixed(2)}% (phải bằng 100%)</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Bảng cột điểm trực tiếp cho đợt chuyên cần (thang 10, không có câu hỏi con). */
function CcColumns(props: {
  dot: Dot
  cloCodes: string[]
  addQuestion: (dot: Dot, maDe: string) => void
  patchQuestion: (id: string, patch: Partial<EditorQuestion>) => void
  deleteQuestion: (id: string) => void
}): React.ReactElement {
  const { dot, addQuestion, patchQuestion, deleteQuestion } = props
  const dotCloCodes = dot.rows.map((row) => row.clo)
  return (
    <div className="border-border/50 space-y-3 border-t pt-4">
      <h4 className="text-sm font-medium">Cột điểm trực tiếp (thang 10)</h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">STT</TableHead>
              <TableHead className="w-28">Mã cột</TableHead>
              <TableHead>Tên cột</TableHead>
              <TableHead className="w-28">CLO</TableHead>
              <TableHead className="w-24">Điểm tối đa</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dot.questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-4 text-center">
                  Chưa có cột điểm. Bấm nút bên dưới để thêm.
                </TableCell>
              </TableRow>
            ) : (
              dot.questions.map((q, idx) => (
                <TableRow key={q._id}>
                  <TableCell className="text-muted-foreground text-center">{idx + 1}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {q.maCotDiem}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={q.cau}
                      onChange={(e) => patchQuestion(q._id, { cau: e.target.value })}
                      placeholder="VD: Điểm chuyên cần"
                      className="text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={q.clo || undefined}
                      onValueChange={(v) => patchQuestion(q._id, { clo: v })}
                      disabled={dotCloCodes.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn CLO" />
                      </SelectTrigger>
                      <SelectContent>
                        {dotCloCodes.map((code) => (
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
                      value={q.diemToiDa || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        patchQuestion(q._id, { diemToiDa: val === '' ? 0 : Number(val) })
                      }}
                      onFocus={(e) => e.target.select()}
                      className="w-20 text-right font-mono text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q._id)}>
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button size="sm" variant="outline" onClick={() => addQuestion(dot, 'ALL')}>
        <Plus className="mr-1 size-4" /> Thêm cột điểm
      </Button>
    </div>
  )
}

/** Bảng câu hỏi cho đợt GK/CK, chia theo mã đề; mã cột điểm tự sinh, chỉ đọc. */
function ExamQuestions(props: {
  dot: Dot
  examCodes: string[]
  cloCodes: string[]
  addQuestion: (dot: Dot, maDe: string) => void
  patchQuestion: (id: string, patch: Partial<EditorQuestion>) => void
  deleteQuestion: (id: string) => void
  addExamCode: (maDauDiem: string, maDe: string) => void
  deleteExamCode: (maDauDiem: string, maDe: string) => void
}): React.ReactElement {
  const {
    dot,
    examCodes,
    cloCodes,
    addQuestion,
    patchQuestion,
    deleteQuestion,
    addExamCode,
    deleteExamCode
  } = props
  const [newExamCode, setNewExamCode] = React.useState('')

  const handleAddExamCode = (): void => {
    const code = newExamCode.trim().toUpperCase()
    if (!code || code === 'ALL' || examCodes.includes(code)) return
    addExamCode(dot.maDauDiem, code)
    setNewExamCode('')
  }

  return (
    <div className="border-border/50 space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Cấu trúc đề — câu hỏi &amp; CLO</h4>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Mã đề mới (VD: D2, D3...)"
            value={newExamCode}
            onChange={(e) => setNewExamCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExamCode()}
            className="w-48 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAddExamCode}>
            <Plus className="mr-1 size-4" /> Thêm đề
          </Button>
        </div>
      </div>
      <Tabs defaultValue="ALL" className="space-y-3">
        <TabsList>
          {examCodes.map((de) => (
            <div key={de} className="flex items-center gap-1">
              <TabsTrigger value={de} className="px-2 py-1 text-xs">
                {de === 'ALL' ? 'Chung (ALL)' : `Đề ${de}`}
              </TabsTrigger>
              {de !== 'ALL' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => deleteExamCode(dot.maDauDiem, de)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </TabsList>
        {examCodes.map((de) => {
          const questions = dot.questions.filter((q) => (q.maDe || 'ALL') === de)
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
                      <TableHead className="w-28">Mã cột</TableHead>
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
                        <TableCell colSpan={7} className="text-muted-foreground py-4 text-center">
                          Chưa có câu hỏi. Bấm nút bên dưới để thêm.
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((q, idx) => (
                        <TableRow key={q._id}>
                          <TableCell className="text-muted-foreground text-center">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {q.maCotDiem}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={q.cau}
                              onChange={(e) => patchQuestion(q._id, { cau: e.target.value })}
                              className="font-mono text-sm"
                              placeholder="VD: Câu 1a"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={q.clo || undefined}
                              onValueChange={(v) => patchQuestion(q._id, { clo: v })}
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
                              value={q.diemToiDa || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                patchQuestion(q._id, { diemToiDa: val === '' ? 0 : Number(val) })
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-20 text-right font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={q.loai || 'TL'}
                              onValueChange={(v) =>
                                patchQuestion(q._id, { loai: v as 'TL' | 'TN' })
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
                              onClick={() => deleteQuestion(q._id)}
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Button size="sm" variant="outline" onClick={() => addQuestion(dot, de)}>
                <Plus className="mr-1 size-4" /> Thêm câu hỏi vào đề {de === 'ALL' ? '(chung)' : de}
              </Button>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
