/**
 * Module tính điểm học phần (C_hp)
 * Hỗ trợ 2 phương pháp: QD450 và RAW_POINTS, đối soát cảnh báo chênh lệch
 */

import Decimal from 'decimal.js'
import { roundStep } from '../../rules'
import type {
  AssessmentGroup,
  CellScoreDetail,
  CourseConfig,
  GroupScoreDetail
} from '../../types'

export interface CourseScoreCalculationResult {
  courseScore: number
  courseScoreQd450: number
  courseScoreRawPoints: number
  scoreDifferenceWarning?: string
  isPassedHp: boolean
}

/**
 * Tính điểm học phần theo cả 2 phương pháp QĐ450 và RAW_POINTS
 */
export function calculateCourseScores(
  config: CourseConfig,
  cellScores: Record<string, CellScoreDetail>,
  groupScores: Record<AssessmentGroup, GroupScoreDetail>,
  sumWeightedClo: Decimal,
  sumCloWeights: Decimal
): CourseScoreCalculationResult {
  const rules = config.quyTac
  const mode = rules.rounding_mode ?? 'chain'

  // Cách 1: QĐ450 Điều 9.3: 0.2*C_cc + 0.3*C_gk + 0.5*C_ck
  let cHpQd450Dec = new Decimal(0)
  if (config.courseInfo.loaiHp === 'thuc_hanh') {
    // Học phần thực hành: C_hp = sum(CLO_k * trong_so_k) / sum(trong_so_k)
    cHpQd450Dec = sumCloWeights.gt(0) ? sumWeightedClo.div(sumCloWeights) : new Decimal(0)
  } else {
    // Học phần thường
    const cCC = new Decimal(groupScores.CC.score)
    const cGK = new Decimal(groupScores.GK.score)
    const cCK = new Decimal(groupScores.CK.score)
    cHpQd450Dec = cCC.mul(0.2).add(cGK.mul(0.3)).add(cCK.mul(0.5))
  }
  const courseScoreQd450 = roundStep(cHpQd450Dec.toNumber(), mode, 1)

  // Cách 2: RAW_POINTS (phương thức cũ để đối soát)
  let totalRawEarned = new Decimal(0)
  for (const p of config.keHoachDanhGia) {
    const cellKey = `${p.maDauDiem}_${p.clo}`
    const cell = cellScores[cellKey]
    if (cell) {
      const wRatio = new Decimal(p.trongSoPhanTram).div(100)
      totalRawEarned = totalRawEarned.add(new Decimal(cell.score).mul(wRatio))
    }
  }
  const courseScoreRawPoints = roundStep(totalRawEarned.toNumber(), mode, 1)

  // Chọn điểm học phần theo hp_method
  const courseScore = rules.hp_method === 'RAW_POINTS' ? courseScoreRawPoints : courseScoreQd450

  // Cảnh báo nếu lệch >= 0.1 giữa 2 phương pháp
  let scoreDifferenceWarning: string | undefined
  const diff = Math.abs(courseScoreQd450 - courseScoreRawPoints)
  if (diff >= 0.1) {
    scoreDifferenceWarning = `Điểm học phần theo QĐ450 (${courseScoreQd450}) lệch ${diff.toFixed(1)} điểm so với tính theo điểm thô RAW_POINTS (${courseScoreRawPoints})`
  }

  const isPassedHp = courseScore >= rules.nguong_dat_hp

  return {
    courseScore,
    courseScoreQd450,
    courseScoreRawPoints,
    scoreDifferenceWarning,
    isPassedHp
  }
}

// Re-export calculatePloScores cho tương thích ngược
export { calculatePloScores } from '../plo'
