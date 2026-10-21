/**
 * Module tính điểm học phần (C_hp) và điểm PLO thành phần
 * Hỗ trợ 2 phương pháp: QD450 và RAW_POINTS, đối soát cảnh báo chênh lệch
 */

import Decimal from 'decimal.js'
import { roundStep } from '../rules'
import type {
  AssessmentGroup,
  CellScoreDetail,
  CourseConfig,
  GroupScoreDetail,
  PLOMapping
} from '../types'

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

/**
 * Tính điểm PLO thành phần từ ma trận ánh xạ CLO -> PLO
 */
export function calculatePloScores(
  maTranPlo: PLOMapping[],
  cloScores: Record<string, number>,
  mode: 'chain' | 'final_only' = 'chain'
): Record<string, number> {
  const ploMap = new Map<string, string[]>()
  for (const mRow of maTranPlo) {
    const list = ploMap.get(mRow.plo) ?? []
    if (!list.includes(mRow.clo)) {
      list.push(mRow.clo)
    }
    ploMap.set(mRow.plo, list)
  }

  const ploScores: Record<string, number> = {}
  for (const [ploCode, cloList] of ploMap.entries()) {
    let sumPlo = new Decimal(0)
    let countPlo = 0

    for (const cloCode of cloList) {
      const sc = cloScores[cloCode]
      if (sc !== undefined) {
        sumPlo = sumPlo.add(sc)
        countPlo++
      }
    }

    if (countPlo > 0) {
      const rawPlo = sumPlo.div(countPlo).toNumber()
      ploScores[ploCode] = roundStep(rawPlo, mode, 1)
    } else {
      ploScores[ploCode] = 0
    }
  }

  return ploScores
}
