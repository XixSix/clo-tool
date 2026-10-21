/**
 * Module tính điểm CLO cả học phần, CLO từng đợt (quá trình/cuối kỳ), TBC CLO và Điểm nhóm (C_cc, C_gk, C_ck)
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 */

import Decimal from 'decimal.js'
import { numberToWordsVi } from '../numberToWordsVi'
import { roundStep } from '../rules'
import type {
  AssessmentGroup,
  CellScoreDetail,
  CLODefinition,
  CourseConfig,
  EvaluationPlanItem,
  GroupScoreDetail
} from '../types'

export interface CloCalculationResult {
  cloScores: Record<string, number>
  processCloScores: Record<string, number>
  finalCloScores: Record<string, number>
}

export interface TbcCloResult {
  tbcClo: number
  tbcCloInWords: string
  sumWeightedClo: Decimal
  sumCloWeights: Decimal
}

export interface GroupScoreResult {
  groupScores: Record<AssessmentGroup, GroupScoreDetail>
  tbQuaTrinh?: number
}

/**
 * Tính điểm CLO cả học phần, quá trình và cuối kỳ
 */
export function calculateCloScores(
  config: CourseConfig,
  cellScores: Record<string, CellScoreDetail>
): CloCalculationResult {
  const mode = config.quyTac.rounding_mode ?? 'chain'
  const cloScores: Record<string, number> = {}
  const processCloScores: Record<string, number> = {}
  const finalCloScores: Record<string, number> = {}

  for (const clo of config.cloList) {
    const cloCode = clo.maClo

    // 2.1 CLO cả học phần: tổng w(j,k) * s(j,k) / tổng w(j,k)
    let weightedSumAll = new Decimal(0)
    let totalWeightAll = new Decimal(0)

    // 2.2 CLO quá trình (nhóm CC và GK)
    let weightedSumProcess = new Decimal(0)
    let totalWeightProcess = new Decimal(0)

    // 2.3 CLO cuối kỳ (nhóm CK)
    let weightedSumFinal = new Decimal(0)
    let totalWeightFinal = new Decimal(0)

    for (const p of config.keHoachDanhGia) {
      if (p.clo !== cloCode) continue
      const cellKey = `${p.maDauDiem}_${p.clo}`
      const cell = cellScores[cellKey]
      if (!cell) continue

      const w = new Decimal(p.trongSoPhanTram)
      const s = new Decimal(cell.score)

      weightedSumAll = weightedSumAll.add(w.mul(s))
      totalWeightAll = totalWeightAll.add(w)

      if (p.nhom === 'CC' || p.nhom === 'GK') {
        weightedSumProcess = weightedSumProcess.add(w.mul(s))
        totalWeightProcess = totalWeightProcess.add(w)
      } else if (p.nhom === 'CK') {
        weightedSumFinal = weightedSumFinal.add(w.mul(s))
        totalWeightFinal = totalWeightFinal.add(w)
      }
    }

    if (totalWeightAll.gt(0)) {
      const rawClo = weightedSumAll.div(totalWeightAll).toNumber()
      cloScores[cloCode] = roundStep(rawClo, mode, 1)
    } else {
      cloScores[cloCode] = 0
    }

    if (totalWeightProcess.gt(0)) {
      const rawProc = weightedSumProcess.div(totalWeightProcess).toNumber()
      processCloScores[cloCode] = roundStep(rawProc, mode, 1)
    }

    if (totalWeightFinal.gt(0)) {
      const rawFin = weightedSumFinal.div(totalWeightFinal).toNumber()
      finalCloScores[cloCode] = roundStep(rawFin, mode, 1)
    }
  }

  return {
    cloScores,
    processCloScores,
    finalCloScores
  }
}

/**
 * Tính điểm trung bình cộng CLO (TBC CLO) có trọng số và chuyển thành chữ tiếng Việt
 */
export function calculateTbcClo(
  cloList: CLODefinition[],
  cloScores: Record<string, number>,
  mode: 'chain' | 'final_only' = 'chain'
): TbcCloResult {
  let sumWeightedClo = new Decimal(0)
  let sumCloWeights = new Decimal(0)

  for (const clo of cloList) {
    const score = cloScores[clo.maClo] ?? 0
    const w = clo.trongSoClo ?? 1
    sumWeightedClo = sumWeightedClo.add(new Decimal(score).mul(w))
    sumCloWeights = sumCloWeights.add(w)
  }

  const rawTbcClo = sumCloWeights.gt(0) ? sumWeightedClo.div(sumCloWeights).toNumber() : 0
  const tbcClo = roundStep(rawTbcClo, mode, 1)
  const tbcCloInWords = numberToWordsVi(tbcClo, 1, true)

  return {
    tbcClo,
    tbcCloInWords,
    sumWeightedClo,
    sumCloWeights
  }
}

/**
 * Tính điểm các nhóm đánh giá C_cc, C_gk, C_ck và TB quá trình
 */
export function calculateGroupScores(
  keHoachDanhGia: EvaluationPlanItem[],
  cellScores: Record<string, CellScoreDetail>,
  mode: 'chain' | 'final_only' = 'chain'
): GroupScoreResult {
  const groups: AssessmentGroup[] = ['CC', 'GK', 'CK']
  const groupScores: Record<AssessmentGroup, GroupScoreDetail> = {
    CC: { nhom: 'CC', score: 0, cloCodes: [], cloScores: {} },
    GK: { nhom: 'GK', score: 0, cloCodes: [], cloScores: {} },
    CK: { nhom: 'CK', score: 0, cloCodes: [], cloScores: {} }
  }

  for (const grp of groups) {
    const itemsInGroup = keHoachDanhGia.filter((p) => p.nhom === grp)
    const cloSet = new Set(itemsInGroup.map((p) => p.clo))
    const cloCodes = Array.from(cloSet)

    let sumGroupClo = new Decimal(0)
    const groupCloMap: Record<string, number> = {}

    for (const cloCode of cloCodes) {
      const cellsOfCloInGroup = itemsInGroup.filter((p) => p.clo === cloCode)
      let wSum = new Decimal(0)
      let wTotal = new Decimal(0)

      for (const p of cellsOfCloInGroup) {
        const cellKey = `${p.maDauDiem}_${p.clo}`
        const cell = cellScores[cellKey]
        if (cell) {
          const w = new Decimal(p.trongSoPhanTram)
          wSum = wSum.add(w.mul(cell.score))
          wTotal = wTotal.add(w)
        }
      }

      const cloScoreInGroup = wTotal.gt(0) ? roundStep(wSum.div(wTotal).toNumber(), mode, 1) : 0

      groupCloMap[cloCode] = cloScoreInGroup
      sumGroupClo = sumGroupClo.add(cloScoreInGroup)
    }

    const meanGroup = cloCodes.length > 0 ? sumGroupClo.div(cloCodes.length).toNumber() : 0
    const scoreGroup = roundStep(meanGroup, mode, 1)

    groupScores[grp] = {
      nhom: grp,
      score: scoreGroup,
      cloCodes,
      cloScores: groupCloMap
    }
  }

  let tbQuaTrinh: number | undefined
  if (groupScores.CC.score > 0 || groupScores.GK.score > 0) {
    const sumProc = new Decimal(groupScores.CC.score).add(groupScores.GK.score)
    tbQuaTrinh = roundStep(sumProc.div(2).toNumber(), mode, 1)
  }

  return {
    groupScores,
    tbQuaTrinh
  }
}
