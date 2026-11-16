/**
 * Module tính điểm CLO toàn học phần, CLO theo giai đoạn (quá trình/cuối kỳ),
 * điểm nhóm (CC/GK/CK) và TBC CLO.
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 */

import Decimal from 'decimal.js'
import { roundStep } from '../../rules'
import { numberToWordsVi } from '../../utils/numberToWordsVi'
import { componentsByGroup } from '../../utils/courseModel'
import type { AssessmentGroup, AssessmentResult, CLOResult, Course } from '../../types'

export type ScorePhase = 'process' | 'final'

export interface TbcCloResult {
  tbcClo: number
  tbcCloInWords: string
}

export interface GroupScoreDetail {
  nhom: AssessmentGroup
  score: number
  cloCodes: string[]
  cloScores: Record<string, number>
}

export interface GroupScoreResult {
  groupScores: Record<AssessmentGroup, GroupScoreDetail>
  tbQuaTrinh?: number
}

function round(value: number, course: Course): number {
  return roundStep(value, course.quyTac.cheDoLamTron, 1)
}

/** Trọng số của một ô (đợt, CLO) trong toàn học phần. */
function cellWeight(dotWeightPercent: number, tyLePhanBo: number): Decimal {
  return new Decimal(dotWeightPercent).mul(tyLePhanBo).div(100)
}

/**
 * Trung bình có trọng số điểm CLO của một tập đợt đánh giá.
 * CLO không có mặt trong tập đợt → không trả về khóa.
 */
function weightedCloAcross(
  course: Course,
  dotResults: AssessmentResult[],
  filterGroup?: AssessmentGroup[]
): Record<string, number> {
  const byDotId = new Map(dotResults.map((r) => [r.dotDanhGiaId, r]))
  const result: Record<string, number> = {}

  for (const clo of course.cloList) {
    let sum = new Decimal(0)
    let totalWeight = new Decimal(0)

    for (const dot of course.dotDanhGia) {
      if (filterGroup && !filterGroup.includes(dot.nhom)) continue
      const mapping = dot.cloList.find((m) => m.cloId === clo.id)
      if (!mapping) continue
      const dotResult = byDotId.get(dot.id)
      if (!dotResult) continue
      const cell = dotResult.clo.find((c) => c.cloId === clo.id)
      if (!cell) continue

      const w = cellWeight(dot.trongSoPhanTram, mapping.tyLePhanBo)
      sum = sum.add(w.mul(cell.diem))
      totalWeight = totalWeight.add(w)
    }

    if (totalWeight.gt(0)) result[clo.id] = round(sum.div(totalWeight).toNumber(), course)
  }

  return result
}

/** Điểm CLO toàn học phần (gom mọi đợt đánh giá). */
export function calculateCloResults(course: Course, dotResults: AssessmentResult[]): CLOResult[] {
  const scores = weightedCloAcross(course, dotResults)
  return course.cloList.map((clo) => ({ cloId: clo.id, diem: scores[clo.id] ?? 0 }))
}

/** Điểm CLO của giai đoạn Quá trình (CC + GK) hoặc Cuối kỳ (CK). */
export function calculatePhaseCloScores(
  course: Course,
  dotResults: AssessmentResult[],
  phase: ScorePhase
): Record<string, number> {
  return weightedCloAcross(course, dotResults, phase === 'process' ? ['CC', 'GK'] : ['CK'])
}

/** Điểm nhóm CC/GK/CK = trung bình cộng điểm các CLO có mặt trong nhóm. */
export function calculateGroupScores(
  course: Course,
  dotResults: AssessmentResult[]
): GroupScoreResult {
  const groups: AssessmentGroup[] = ['CC', 'GK', 'CK']
  const byDotId = new Map(dotResults.map((r) => [r.dotDanhGiaId, r]))
  const groupScores = {} as Record<AssessmentGroup, GroupScoreDetail>

  for (const group of groups) {
    const dots = componentsByGroup(course, [group])
    const cloCodes = Array.from(new Set(dots.flatMap((dot) => dot.cloList.map((m) => m.cloId))))
    const cloScores: Record<string, number> = {}
    let sumGroup = new Decimal(0)

    for (const cloId of cloCodes) {
      let sum = new Decimal(0)
      let totalWeight = new Decimal(0)
      for (const dot of dots) {
        const mapping = dot.cloList.find((m) => m.cloId === cloId)
        if (!mapping) continue
        const cell = byDotId.get(dot.id)?.clo.find((c) => c.cloId === cloId)
        if (!cell) continue
        const w = cellWeight(dot.trongSoPhanTram, mapping.tyLePhanBo)
        sum = sum.add(w.mul(cell.diem))
        totalWeight = totalWeight.add(w)
      }
      const score = totalWeight.gt(0) ? round(sum.div(totalWeight).toNumber(), course) : 0
      cloScores[cloId] = score
      sumGroup = sumGroup.add(score)
    }

    groupScores[group] = {
      nhom: group,
      score: cloCodes.length > 0 ? round(sumGroup.div(cloCodes.length).toNumber(), course) : 0,
      cloCodes,
      cloScores
    }
  }

  let tbQuaTrinh: number | undefined
  if (groupScores.CC.score > 0 || groupScores.GK.score > 0) {
    tbQuaTrinh = round(
      new Decimal(groupScores.CC.score).add(groupScores.GK.score).div(2).toNumber(),
      course
    )
  }

  return { groupScores, tbQuaTrinh }
}

/** TBC CLO = trung bình cộng thuần các CLO của học phần. */
export function calculateTbcClo(course: Course, cloResults: CLOResult[]): TbcCloResult {
  const byId = new Map(cloResults.map((c) => [c.cloId, c.diem]))
  let sum = new Decimal(0)
  let count = 0

  for (const clo of course.cloList) {
    sum = sum.add(byId.get(clo.id) ?? 0)
    count++
  }

  const tbcClo = count > 0 ? round(sum.div(count).toNumber(), course) : 0
  return {
    tbcClo,
    tbcCloInWords: numberToWordsVi(tbcClo, 1, true)
  }
}
