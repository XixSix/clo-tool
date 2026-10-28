/**
 * Module tính điểm và thống kê Chuẩn đầu ra chương trình đào tạo (PLO)
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 */

import Decimal from 'decimal.js'
import { roundHalfUp, roundStep } from '../../rules'
import type { PLOMapping, PloStat, ProcessedStudentResult } from '../../types'

/**
 * Tính điểm PLO thành phần từ ma trận ánh xạ CLO -> PLO cho 1 sinh viên
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

/**
 * Thống kê tỷ lệ Đạt/Không đạt, Min, Max, TB cho từng PLO toàn lớp
 */
export function calculatePloStats(
  maTranPlo: PLOMapping[],
  students: ProcessedStudentResult[],
  nguongDatPlo = 4.0
): Record<string, PloStat> {
  const ploSet = new Set(maTranPlo.map((p) => p.plo))
  const totalStudents = students.length
  const ploStats: Record<string, PloStat> = {}

  for (const ploCode of ploSet) {
    const scores = students.map((s) => s.ploScores[ploCode] ?? 0)
    const passedCount = scores.filter((s) => s >= nguongDatPlo).length
    const failedCount = totalStudents - passedCount
    const passedPercent =
      totalStudents > 0 ? roundHalfUp((passedCount / totalStudents) * 100, 1) : 0
    const failedPercent = totalStudents > 0 ? roundHalfUp(100 - passedPercent, 1) : 0

    const sumScore = scores.reduce((acc, s) => acc.add(s), new Decimal(0))
    const mean = totalStudents > 0 ? roundHalfUp(sumScore.div(totalStudents).toNumber(), 1) : 0

    ploStats[ploCode] = {
      plo: ploCode,
      passedCount,
      passedPercent,
      failedCount,
      failedPercent,
      mean
    }
  }

  return ploStats
}
