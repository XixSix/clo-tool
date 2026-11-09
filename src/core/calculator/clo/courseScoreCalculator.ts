/**
 * Module tính điểm học phần (C_hp)
 * Hỗ trợ 2 phương pháp: QD450 và RAW_POINTS, đối soát cảnh báo chênh lệch.
 */

import Decimal from 'decimal.js'
import { roundStep } from '../../rules'
import type { AssessmentGroup, AssessmentResult, CLOResult, Course } from '../../types'
import type { GroupScoreDetail } from './cloScoreCalculator'

export interface CourseScoreCalculationResult {
  courseScore: number
  courseScoreQd450: number
  courseScoreRawPoints: number
  scoreDifferenceWarning?: string
  isPassedHp: boolean
}

/**
 * Tính điểm học phần theo cả 2 phương pháp QĐ450 và RAW_POINTS.
 */
export function calculateCourseScores(
  course: Course,
  dotResults: AssessmentResult[],
  groupScores: Record<AssessmentGroup, GroupScoreDetail>,
  cloResults: CLOResult[]
): CourseScoreCalculationResult {
  const rules = course.quyTac
  const mode = rules.cheDoLamTron ?? 'chain'

  let cHpQd450 = new Decimal(0)
  if (course.loaiHp === 'thuc_hanh') {
    for (const clo of course.cloList) {
      const weight = clo.trongSoClo ?? 0
      const score = cloResults.find((c) => c.cloId === clo.id)?.diem ?? 0
      cHpQd450 = cHpQd450.add(new Decimal(score).mul(weight).div(100))
    }
  } else {
    cHpQd450 = new Decimal(groupScores.CC.score)
      .mul(0.2)
      .add(new Decimal(groupScores.GK.score).mul(0.3))
      .add(new Decimal(groupScores.CK.score).mul(0.5))
  }
  const courseScoreQd450 = roundStep(cHpQd450.toNumber(), mode, 1)

  let totalRaw = new Decimal(0)
  const resultByDot = new Map(dotResults.map((r) => [r.dotDanhGiaId, r]))
  for (const dot of course.dotDanhGia) {
    const result = resultByDot.get(dot.id)
    if (!result) continue
    totalRaw = totalRaw.add(new Decimal(result.diem).mul(dot.trongSoPhanTram).div(100))
  }
  const courseScoreRawPoints = roundStep(totalRaw.toNumber(), mode, 1)

  const courseScore =
    rules.phuongThucTinhHp === 'RAW_POINTS' ? courseScoreRawPoints : courseScoreQd450

  let scoreDifferenceWarning: string | undefined
  const diff = Math.abs(courseScoreQd450 - courseScoreRawPoints)
  if (diff >= 0.1) {
    scoreDifferenceWarning = `Điểm học phần theo QĐ450 (${courseScoreQd450}) lệch ${diff.toFixed(
      1
    )} điểm so với tính theo điểm thô RAW_POINTS (${courseScoreRawPoints})`
  }

  return {
    courseScore,
    courseScoreQd450,
    courseScoreRawPoints,
    scoreDifferenceWarning,
    isPassedHp: courseScore >= rules.nguongDatHp
  }
}
