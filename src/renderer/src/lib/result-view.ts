/**
 * Adapter hiển thị: chuyển model nghiệp vụ phân cấp (Course → đợt → CLO)
 * sang dạng phẳng mà các màn hình hiện có đang dùng.
 *
 * Chỉ phục vụ renderer — không chứa logic tính điểm, mọi phép tính đều gọi
 * lại engine trong `src/core`.
 */

import {
  calculateGroupScores,
  calculatePhaseCloScores
} from '@core/calculator/clo/cloScoreCalculator'
import { numberToWordsVi } from '@core/utils/numberToWordsVi'
import type {
  AssessmentGroup,
  ClassEvaluationSummary,
  Course,
  Student,
  StudentCourseResult,
  ValidationIssue
} from '@core/types'
import type { RunSnapshotDto } from '../../../shared/ipc'

/* ============================================================
   Dạng phẳng của cấu hình học phần (dùng cho thẻ tóm tắt / báo cáo in)
   ============================================================ */

export interface CourseInfoView {
  maHp: string
  tenHp: string
  soTinChi: number
  hinhThucThi: string
  loaiHp: 'thuong' | 'thuc_hanh'
}

export interface CloView {
  maClo: string
  noiDung: string
  bacNangLuc: string
  trongSoClo?: number
}

export interface PlanItemView {
  nhom: AssessmentGroup
  thanhPhan: string
  maDauDiem: string
  clo: string
  trongSoPhanTram: number
}

export interface QuestionView {
  maCotDiem: string
  maDauDiem: string
  cau: string
  clo: string
  diemToiDa: number
  maDe?: string
  loai?: 'TL' | 'TN'
}

export interface PloMappingView {
  plo: string
  pi: string
  clo: string
}

export interface CourseConfigView {
  courseInfo: CourseInfoView
  cloList: CloView[]
  keHoachDanhGia: PlanItemView[]
  cauHoi: QuestionView[]
  maTranPlo: PloMappingView[]
  quyTac: Course['quyTac']
}

/** Chuyển Course phân cấp sang dạng phẳng để hiển thị. */
export function toCourseView(course: Course): CourseConfigView {
  const cloCodeById = new Map(course.cloList.map((clo) => [clo.id, clo.maClo]))
  const ploCodeById = new Map(course.ploList.map((plo) => [plo.id, plo.maPlo]))
  const partialPloById = new Map(course.ploThanhPhanList.map((p) => [p.id, p]))
  const cloCode = (id: string): string => cloCodeById.get(id) ?? id

  const keHoachDanhGia: PlanItemView[] = []
  const cauHoi: QuestionView[] = []
  for (const dot of course.dotDanhGia) {
    for (const mapping of dot.cloList) {
      keHoachDanhGia.push({
        nhom: dot.nhom,
        thanhPhan: dot.tenDotDanhGia,
        maDauDiem: dot.id,
        clo: cloCode(mapping.cloId),
        trongSoPhanTram: (dot.trongSoPhanTram * mapping.tyLePhanBo) / 100
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

  const maTranPlo: PloMappingView[] = []
  for (const pi of course.piList) {
    for (const partialId of pi.ploThanhPhanIds) {
      const partial = partialPloById.get(partialId)
      const ploCodeText = partial ? (ploCodeById.get(partial.maPlo) ?? partial.maPlo) : ''
      for (const cloId of pi.cloIds) {
        maTranPlo.push({ plo: ploCodeText, pi: pi.maPi, clo: cloCode(cloId) })
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
    cloList: course.cloList.map((clo) => ({
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

/* ============================================================
   Dạng phẳng của kết quả từng sinh viên
   ============================================================ */

export interface CellScoreDetailView {
  maDauDiem: string
  maClo: string
  score: number
  rawScore: number
  totalEarned: number
  totalMax: number
}

export interface GroupScoreDetailView {
  nhom: AssessmentGroup
  score: number
  cloCodes: string[]
  cloScores: Record<string, number>
}

export interface ProcessedStudentResultView {
  tt: number
  maSv: string
  hoTen: string
  ngaySinh?: string
  maDe?: string

  cellScores: Record<string, CellScoreDetailView>
  processCloScores: Record<string, number>
  finalCloScores: Record<string, number>
  cloScores: Record<string, number>
  groupScores: Record<AssessmentGroup, GroupScoreDetailView>

  tbcClo: number
  tbcCloInWords: string
  tbQuaTrinh?: number

  courseScore: number
  courseScoreQd450: number
  courseScoreRawPoints: number
  scoreDifferenceWarning?: string

  ploScores: Record<string, number>

  isPassedHp: boolean
  isAbsentFinal: boolean
  hasMissingData: boolean
  issues: ValidationIssue[]
}

function toIssue(issue: StudentCourseResult['canhBao'][number]): ValidationIssue {
  return { level: issue.mucDo, scope: 'student', targetId: issue.maLoi, message: issue.noiDung }
}

/** Ghép Student + StudentCourseResult thành dòng kết quả phẳng để hiển thị. */
export function toStudentView(
  student: Student,
  result: StudentCourseResult,
  course: Course
): ProcessedStudentResultView {
  const cloCodeById = new Map(course.cloList.map((clo) => [clo.id, clo.maClo]))
  const ploCodeById = new Map(course.ploList.map((plo) => [plo.id, plo.maPlo]))
  const cloCode = (id: string): string => cloCodeById.get(id) ?? id

  const cellScores: Record<string, CellScoreDetailView> = {}
  for (const dot of result.dotDanhGia) {
    for (const cell of dot.clo) {
      const code = cloCode(cell.cloId)
      cellScores[`${dot.dotDanhGiaId}_${code}`] = {
        maDauDiem: dot.dotDanhGiaId,
        maClo: code,
        score: cell.diem,
        rawScore: cell.diemTho ?? cell.diem,
        totalEarned: cell.diem,
        totalMax: 10
      }
    }
  }

  const groupResult = calculateGroupScores(course, result.dotDanhGia)
  const groupScores = {} as Record<AssessmentGroup, GroupScoreDetailView>
  for (const group of ['CC', 'GK', 'CK'] as AssessmentGroup[]) {
    const detail = groupResult.groupScores[group]
    groupScores[group] = {
      nhom: group,
      score: detail?.score ?? 0,
      cloCodes: detail?.cloCodes ?? [],
      cloScores: Object.fromEntries(
        Object.entries(detail?.cloScores ?? {}).map(([id, score]) => [cloCode(id), score])
      )
    }
  }

  const processClos = calculatePhaseCloScores(course, result.dotDanhGia, 'process')
  const finalClos = calculatePhaseCloScores(course, result.dotDanhGia, 'final')
  const cloScores = Object.fromEntries(result.clo.map((clo) => [cloCode(clo.cloId), clo.diem]))
  const ploScores = Object.fromEntries(
    result.plo.map((plo) => [ploCodeById.get(plo.ploId) ?? plo.ploId, plo.diem])
  )

  return {
    tt: student.tt,
    maSv: student.maSv,
    hoTen: student.hoTen,
    ngaySinh: student.ngaySinh,

    cellScores,
    processCloScores: processClos,
    finalCloScores: finalClos,
    cloScores,
    groupScores,

    tbcClo: result.tbcClo,
    tbcCloInWords: numberToWordsVi(result.tbcClo, 1, true),
    tbQuaTrinh: result.diemQuaTrinh,

    courseScore: result.diemHocPhan,
    courseScoreQd450: result.diemHocPhanQd450 ?? result.diemHocPhan,
    courseScoreRawPoints: result.diemHocPhanRawPoints ?? result.diemHocPhan,
    scoreDifferenceWarning: result.canhBao.find((issue) => issue.maLoi === 'SCORE_DIFFERENCE')
      ?.noiDung,

    ploScores,

    isPassedHp: result.datHocPhan,
    isAbsentFinal: result.vangThiCuoiKy,
    hasMissingData: result.thieuDuLieu,
    issues: result.canhBao.map(toIssue)
  }
}

/** Ghép toàn bộ snapshot thành danh sách dòng kết quả phẳng. */
export function buildStudentViews(snapshot: RunSnapshotDto): ProcessedStudentResultView[] {
  const resultById = new Map(snapshot.results.map((r) => [r.sinhVienId, r]))
  const views: ProcessedStudentResultView[] = []
  for (const student of snapshot.students) {
    const result = resultById.get(student.id)
    if (result) views.push(toStudentView(student, result, snapshot.config))
  }
  return views
}

/* ============================================================
   Dạng phẳng của thống kê toàn lớp
   ============================================================ */

export interface CloStatView {
  maClo: string
  passedCount: number
  passedPercent: number
  failedCount: number
  failedPercent: number
  mean: number
  min: number
  max: number
  isBelowThreshold: boolean
}

export interface PloStatView {
  plo: string
  passedCount: number
  passedPercent: number
  failedCount: number
  failedPercent: number
  mean: number
}

export interface CourseStatView {
  passedCount: number
  passedPercent: number
  failedCount: number
  failedPercent: number
  mean: number
  min: number
  max: number
}

export interface ClassEvaluationSummaryView {
  totalStudents: number
  evaluatedStudents: number
  absentStudents: number
  missingDataStudents: number
  cloStats: Record<string, CloStatView>
  ploStats: Record<string, PloStatView>
  courseStat: CourseStatView
  generalWarnings: string[]
}

/** Chuyển thống kê phân cấp sang dạng key theo mã CLO/PLO như UI đang dùng. */
export function toSummaryView(
  summary: ClassEvaluationSummary,
  course: Course
): ClassEvaluationSummaryView {
  const cloCodeById = new Map(course.cloList.map((clo) => [clo.id, clo.maClo]))
  const ploCodeById = new Map(course.ploList.map((plo) => [plo.id, plo.maPlo]))

  const cloStats: Record<string, CloStatView> = {}
  for (const stat of summary.clo) {
    const code = cloCodeById.get(stat.cloId) ?? stat.cloId
    cloStats[code] = {
      maClo: code,
      passedCount: stat.soSinhVienDat,
      passedPercent: stat.tyLeDat,
      failedCount: stat.soSinhVienKhongDat,
      failedPercent: stat.tyLeKhongDat,
      mean: stat.trungBinh,
      min: stat.thapNhat,
      max: stat.caoNhat,
      isBelowThreshold: stat.duoiNguongCanhBao
    }
  }

  const ploStats: Record<string, PloStatView> = {}
  for (const stat of summary.plo) {
    const code = ploCodeById.get(stat.ploId) ?? stat.ploId
    ploStats[code] = {
      plo: code,
      passedCount: stat.soSinhVienDat,
      passedPercent: stat.tyLeDat,
      failedCount: stat.soSinhVienKhongDat,
      failedPercent: stat.tyLeKhongDat,
      mean: stat.trungBinh
    }
  }

  return {
    totalStudents: summary.tongSinhVien,
    evaluatedStudents: summary.soSinhVienDuocTinh,
    absentStudents: summary.soSinhVienVangThi,
    missingDataStudents: summary.soSinhVienThieuDuLieu,
    cloStats,
    ploStats,
    courseStat: {
      passedCount: summary.hocPhan.soSinhVienDat,
      passedPercent: summary.hocPhan.tyLeDat,
      failedCount: summary.hocPhan.soSinhVienKhongDat,
      failedPercent: summary.hocPhan.tyLeKhongDat,
      mean: summary.hocPhan.trungBinh,
      min: summary.hocPhan.thapNhat,
      max: summary.hocPhan.caoNhat
    },
    generalWarnings: summary.canhBao
  }
}
