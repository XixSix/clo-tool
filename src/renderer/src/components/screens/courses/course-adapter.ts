/**
 * Chuyển đổi giữa dạng phẳng của editor (renderer) và model phân cấp `Course` (core).
 *
 * Editor vẫn thao tác trên các dòng phẳng (kế hoạch đánh giá + câu hỏi + ma trận PLO)
 * để giữ nguyên trải nghiệm nhập liệu; khi lưu mới gom thành `Course`.
 */

import type {
  AssessmentComponent,
  AssessmentGroup,
  AssessmentCLOMapping,
  Course,
  ExamQuestion,
  ExamVariant,
  PartialPLO,
  PerformanceIndicator,
  PLO
} from '@core/types/course'
import { roundHalfUp } from '@core/rules'
import type {
  CLODefinition,
  CourseConfig,
  EvaluationPlanItem,
  PLOMapping,
  QuestionColumn
} from './course-editor-types'

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

/** Dữ liệu môn ngoài model, gắn thêm vào Course khi lưu (giảng viên, năm học). */
export interface CourseMetaLike {
  giangVien?: string
  namHoc?: string
}

/** Gom các dòng phẳng của editor thành model Course phân cấp. */
export function editorToCourse(editor: CourseConfig, meta?: CourseMetaLike): Course {
  const maHp = editor.courseInfo.maHp
  const cloList = editor.cloList
    .filter((clo) => clo.maClo.trim() !== '')
    .map((clo) => ({
      id: clo.maClo,
      maClo: clo.maClo,
      noiDung: clo.noiDung,
      bacNangLuc: clo.bacNangLuc,
      trongSoClo: clo.trongSoClo
    }))

  const planRows = editor.keHoachDanhGia.filter((row) => row.clo !== '__PLACEHOLDER__')
  const questionsByDot = groupBy(editor.cauHoi, (q) => q.maDauDiem)
  const planByDot = groupBy(planRows, (p) => p.maDauDiem)

  const dotIds = unique([...planByDot.keys(), ...questionsByDot.keys()])
  const dotDanhGia: AssessmentComponent[] = dotIds.map((dotId) => {
    const rows = planByDot.get(dotId) ?? []
    const questions = questionsByDot.get(dotId) ?? []
    const totalWeight = rows.reduce((sum, row) => sum + (row.trongSoPhanTram || 0), 0)
    const first = rows[0]
    const nhom: AssessmentGroup = first?.nhom ?? 'GK'

    const rowClos = rows.map((r) => r.clo).filter((c) => c && c.trim() !== '')
    const qClos = questions.map((q) => q.clo).filter((c) => c && c.trim() !== '')
    const allCloIds = unique([...rowClos, ...qClos])

    const qScoresByClo = new Map<string, number>()
    let totalQScore = 0
    for (const q of questions) {
      if (q.clo && q.diemToiDa > 0) {
        qScoresByClo.set(q.clo, (qScoresByClo.get(q.clo) ?? 0) + q.diemToiDa)
        totalQScore += q.diemToiDa
      }
    }

    const rowWeightByClo = new Map<string, number>()
    for (const r of rows) {
      if (r.clo) rowWeightByClo.set(r.clo, r.trongSoPhanTram || 0)
    }

    const cloListOfDot: AssessmentCLOMapping[] = []
    if (allCloIds.length > 0) {
      let allocatedTyLe = 0
      allCloIds.forEach((cloId, idx) => {
        let tyLe = 0
        if (totalWeight > 0 && (rowWeightByClo.get(cloId) ?? 0) > 0) {
          tyLe = ((rowWeightByClo.get(cloId) ?? 0) / totalWeight) * 100
        } else if (totalQScore > 0 && (qScoresByClo.get(cloId) ?? 0) > 0) {
          tyLe = ((qScoresByClo.get(cloId) ?? 0) / totalQScore) * 100
        } else {
          tyLe = 100 / allCloIds.length
        }
        tyLe = roundHalfUp(tyLe, 2)
        if (idx === allCloIds.length - 1) {
          tyLe = roundHalfUp(100 - allocatedTyLe, 2)
        } else {
          allocatedTyLe += tyLe
        }
        cloListOfDot.push({ cloId, tyLePhanBo: tyLe })
      })
    }

    const variantsByCode = groupBy(questions, (q) => q.maDe || 'ALL')
    const maDeList: ExamVariant[] = Array.from(variantsByCode.entries()).map(([maDe, list]) => ({
      id: `${dotId}_${maDe}`,
      maDe,
      cauHoi: list.map((q): ExamQuestion => ({
        id: q.maCotDiem,
        cau: q.cau,
        diemToiDa: q.diemToiDa,
        cloId: q.clo,
        loai: q.loai
      }))
    }))

    let cachNhapDiem: AssessmentComponent['cachNhapDiem'] =
      first?.cachNhapDiem ?? 'DIRECT_CLO_SCORE'
    if (!first?.cachNhapDiem) {
      if (questions.length > 0) cachNhapDiem = 'QUESTION_SCORE'
      else if (nhom === 'CC') cachNhapDiem = 'ATTENDANCE'
    }

    return {
      id: dotId,
      tenDotDanhGia: first?.thanhPhan?.trim() || dotId,
      nhom,
      cachNhapDiem,
      trongSoPhanTram: totalWeight,
      cloList: cloListOfDot,
      maDeList
    }
  })

  // Dựng cây PLO → PLO thành phần → PI từ các dòng ánh xạ phẳng.
  const mappingRows = editor.maTranPlo.filter(
    (row) => row.plo.trim() !== '' && row.pi.trim() !== ''
  )
  const rowsByPlo = groupBy(mappingRows, (row) => row.plo)
  const ploList: PLO[] = []
  const ploThanhPhanList: PartialPLO[] = []
  const piList: PerformanceIndicator[] = []

  for (const [ploCode, rows] of rowsByPlo) {
    const partialId = `${ploCode}_1`
    const piCodes = unique(rows.map((row) => row.pi).filter((pi) => pi.trim() !== ''))

    ploList.push({
      id: ploCode,
      maPlo: ploCode,
      noiDung: '',
      ploThanhPhanIds: [partialId]
    })
    ploThanhPhanList.push({
      id: partialId,
      maPloThanhPhan: `${ploCode}.1`,
      maPlo: ploCode,
      noiDung: '',
      piIds: piCodes
    })

    for (const piCode of piCodes) {
      const cloIds = unique(
        rows.filter((row) => row.pi === piCode && row.clo.trim() !== '').map((row) => row.clo)
      )
      piList.push({
        id: piCode,
        maPi: piCode,
        noiDung: '',
        ploThanhPhanIds: [partialId],
        cloIds
      })
    }
  }

  return {
    id: maHp,
    maHp,
    tenHp: editor.courseInfo.tenHp,
    soTinChi: editor.courseInfo.soTinChi,
    hinhThucThi: editor.courseInfo.hinhThucThi,
    loaiHp: editor.courseInfo.loaiHp,
    giangVien: meta?.giangVien?.trim() || undefined,
    namHoc: meta?.namHoc?.trim() || undefined,
    cloList,
    ploList,
    ploThanhPhanList,
    piList,
    dotDanhGia,
    quyTac: editor.quyTac
  }
}

/** Chuyển Course đã lưu về dạng phẳng để nạp vào editor. */
export function courseToEditor(course: Course): CourseConfig {
  const cloCodeById = new Map(course.cloList.map((clo) => [clo.id, clo.maClo]))
  const ploCodeById = new Map(course.ploList.map((plo) => [plo.id, plo.maPlo]))
  const partialById = new Map(course.ploThanhPhanList.map((p) => [p.id, p]))
  const cloCode = (id: string): string => cloCodeById.get(id) ?? id

  const keHoachDanhGia: EvaluationPlanItem[] = []
  const cauHoi: QuestionColumn[] = []
  for (const dot of course.dotDanhGia) {
    for (const mapping of dot.cloList) {
      keHoachDanhGia.push({
        nhom: dot.nhom,
        thanhPhan: dot.tenDotDanhGia,
        maDauDiem: dot.id,
        clo: cloCode(mapping.cloId),
        trongSoPhanTram: roundHalfUp((dot.trongSoPhanTram * mapping.tyLePhanBo) / 100, 2),
        cachNhapDiem: dot.cachNhapDiem
      })
    }
    for (const de of dot.maDeList) {
      for (const q of de.cauHoi) {
        cauHoi.push({
          maCotDiem: q.id,
          maDauDiem: dot.id,
          cau: String(q.cau),
          clo: cloCode(q.cloId),
          diemToiDa: q.diemToiDa,
          maDe: de.maDe,
          loai: q.loai
        })
      }
    }
  }

  const maTranPlo: PLOMapping[] = []
  for (const pi of course.piList) {
    for (const partialId of pi.ploThanhPhanIds) {
      const partial = partialById.get(partialId)
      const ploCode = partial ? (ploCodeById.get(partial.maPlo) ?? partial.maPlo) : ''
      for (const cloId of pi.cloIds) {
        maTranPlo.push({ plo: ploCode, pi: pi.maPi, clo: cloCode(cloId) })
      }
    }
  }

  return {
    courseInfo: {
      maHp: course.maHp,
      tenHp: course.tenHp,
      soTinChi: course.soTinChi,
      hinhThucThi: course.hinhThucThi,
      loaiHp: course.loaiHp
    },
    cloList: course.cloList.map((clo): CLODefinition => ({
      maClo: clo.maClo,
      noiDung: clo.noiDung,
      bacNangLuc: clo.bacNangLuc ?? '',
      trongSoClo: clo.trongSoClo
    })),
    keHoachDanhGia,
    cauHoi,
    maTranPlo,
    quyTac: course.quyTac
  }
}

/**
 * Chuẩn hoá dữ liệu cấu hình đọc từ sessionStorage / IPC về `Course`.
 * Hỗ trợ cả dữ liệu phẳng cũ (có `courseInfo`) để không mất cấu hình đã lưu.
 */
export function normalizeStoredCourse(raw: unknown): Course | null {
  if (!raw || typeof raw !== 'object') return null
  const wrapper = raw as { config?: unknown }
  const value = wrapper.config ?? raw
  if (!value || typeof value !== 'object') return null
  if ('courseInfo' in value) return editorToCourse(value as CourseConfig)
  if ('dotDanhGia' in value) return value as Course
  return null
}
