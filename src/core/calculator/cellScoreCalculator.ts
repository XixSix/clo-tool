/**
 * Module tính điểm CLO thành phần s(j,k) cho từng ô (đầu điểm, CLO)
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 */

import Decimal from 'decimal.js'
import { roundStep } from '../rules'
import type { CellScoreDetail, CourseConfig, QuestionColumn, RawStudentRow } from '../types'

export interface CellCalculationContext {
  cellScores: Record<string, CellScoreDetail>
  warnings: string[]
  hasMissingData: boolean
  isAbsentFinal: boolean
}

/**
 * Tính điểm s(j,k) cho tất cả các ô trong kế hoạch đánh giá của một sinh viên
 */
export function calculateCellScores(
  student: RawStudentRow,
  config: CourseConfig,
  cellQuestionsMap: Map<string, QuestionColumn[]>
): CellCalculationContext {
  const rules = config.quyTac
  const mode = rules.rounding_mode ?? 'chain'

  const cellScores: Record<string, CellScoreDetail> = {}
  const warnings: string[] = []
  let hasMissingData = false
  let isAbsentFinal = false

  for (const p of config.keHoachDanhGia) {
    const cellKey = `${p.maDauDiem}_${p.clo}`
    const questions = cellQuestionsMap.get(cellKey) ?? []

    if (questions.length === 0) {
      // Cột điểm trực tiếp (ví dụ CC hoặc TH thang 10)
      const rawVal = student.diemCacCot[p.maDauDiem]
      if (rawVal === 'VT') {
        if (p.nhom === 'CK') isAbsentFinal = true
        cellScores[cellKey] = {
          maDauDiem: p.maDauDiem,
          maClo: p.clo,
          score: 0,
          rawScore: 0,
          columnCodes: [p.maDauDiem],
          totalEarned: 0,
          totalMax: 10,
          itemRatios: [0]
        }
      } else if (rawVal === null || rawVal === undefined) {
        // Quyết định #9: thiếu điểm coi như 0 nhưng vẫn giữ trọng số trong mẫu số
        // (nhất quán với mức điểm nhóm; vẫn gắn cờ + cảnh báo để QLCL soát)
        hasMissingData = true
        warnings.push(`Chưa nhập điểm cho đầu điểm ${p.maDauDiem} (tính 0)`)
        cellScores[cellKey] = {
          maDauDiem: p.maDauDiem,
          maClo: p.clo,
          score: 0,
          rawScore: 0,
          columnCodes: [p.maDauDiem],
          totalEarned: 0,
          totalMax: 10,
          itemRatios: [0]
        }
      } else {
        const valNum = Number(rawVal)
        const scoreRounded = roundStep(valNum, mode, 1)
        cellScores[cellKey] = {
          maDauDiem: p.maDauDiem,
          maClo: p.clo,
          score: scoreRounded,
          rawScore: valNum,
          columnCodes: [p.maDauDiem],
          totalEarned: valNum,
          totalMax: 10,
          itemRatios: [new Decimal(valNum).div(10).toNumber()]
        }
      }
      continue
    }

    // Ô gồm một hoặc nhiều cột câu hỏi
    let totalEarnedDec = new Decimal(0)
    let totalMaxDec = new Decimal(0)
    const ratios: number[] = []
    const colCodes: string[] = []
    let cellHasVT = false
    let cellHasMissing = false

    for (const q of questions) {
      colCodes.push(q.maCotDiem)
      totalMaxDec = totalMaxDec.add(q.diemToiDa)
      const rawScore = student.diemCacCot[q.maCotDiem]

      if (rawScore === 'VT') {
        cellHasVT = true
      } else if (rawScore === null || rawScore === undefined) {
        // Quyết định #9 (cấp câu): câu trống = 0 điểm câu, vẫn góp tỷ lệ 0 vào
        // trung bình của ô — không hủy cả ô; vẫn gắn cờ + cảnh báo cho QLCL
        cellHasMissing = true
        if (q.diemToiDa > 0) ratios.push(0)
      } else {
        const scoreNum = Number(rawScore)
        totalEarnedDec = totalEarnedDec.add(scoreNum)
        if (q.diemToiDa > 0) {
          ratios.push(new Decimal(scoreNum).div(q.diemToiDa).toNumber())
        }
      }
    }

    if (cellHasVT) {
      if (p.nhom === 'CK') isAbsentFinal = true
      cellScores[cellKey] = {
        maDauDiem: p.maDauDiem,
        maClo: p.clo,
        score: 0,
        rawScore: 0,
        columnCodes: colCodes,
        totalEarned: 0,
        totalMax: totalMaxDec.toNumber(),
        itemRatios: ratios
      }
    } else if (cellHasMissing) {
      // Quyết định #9 (cấp câu): không hủy cả ô — các câu trống đã góp tỷ lệ 0
      // vào trung bình ở trên; sẽ tính như bình thường bên dưới, chỉ thêm cờ +
      // cảnh báo để QLCL soát dữ liệu thiếu
      hasMissingData = true
      warnings.push(`Thiếu dữ liệu ở một số câu của ${p.maDauDiem} (${p.clo}) — câu trống tính 0`)
      let rawCalculatedScore = 0
      if (rules.clo_bo_phan === 'mean_of_ratios') {
        // QĐ450 Điều 9.3: s = (1/n) * sum(d_i / t_i) * 10
        if (ratios.length > 0) {
          const sumRatios = ratios.reduce((acc, r) => acc.add(r), new Decimal(0))
          rawCalculatedScore = sumRatios.div(ratios.length).mul(10).toNumber()
        }
      } else {
        // ratio_of_sums: s = (sum d / sum t) * 10
        if (totalMaxDec.gt(0)) {
          rawCalculatedScore = totalEarnedDec.div(totalMaxDec).mul(10).toNumber()
        }
      }

      const scoreRounded = roundStep(rawCalculatedScore, mode, 1)
      cellScores[cellKey] = {
        maDauDiem: p.maDauDiem,
        maClo: p.clo,
        score: scoreRounded,
        rawScore: rawCalculatedScore,
        columnCodes: colCodes,
        totalEarned: totalEarnedDec.toNumber(),
        totalMax: totalMaxDec.toNumber(),
        itemRatios: ratios
      }
    } else {
      let rawCalculatedScore = 0
      if (rules.clo_bo_phan === 'mean_of_ratios') {
        // QĐ450 Điều 9.3: s = (1/n) * sum(d_i / t_i) * 10
        if (ratios.length > 0) {
          const sumRatios = ratios.reduce((acc, r) => acc.add(r), new Decimal(0))
          rawCalculatedScore = sumRatios.div(ratios.length).mul(10).toNumber()
        }
      } else {
        // ratio_of_sums: s = (sum d / sum t) * 10
        if (totalMaxDec.gt(0)) {
          rawCalculatedScore = totalEarnedDec.div(totalMaxDec).mul(10).toNumber()
        }
      }

      const scoreRounded = roundStep(rawCalculatedScore, mode, 1)
      cellScores[cellKey] = {
        maDauDiem: p.maDauDiem,
        maClo: p.clo,
        score: scoreRounded,
        rawScore: rawCalculatedScore,
        columnCodes: colCodes,
        totalEarned: totalEarnedDec.toNumber(),
        totalMax: totalMaxDec.toNumber(),
        itemRatios: ratios
      }
    }
  }

  return {
    cellScores,
    warnings,
    hasMissingData,
    isAbsentFinal
  }
}
