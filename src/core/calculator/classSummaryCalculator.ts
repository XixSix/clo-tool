/**
 * Module thống kê tổng hợp kết quả học tập toàn lớp (CLO, PLO, Điểm HP)
 */

import Decimal from 'decimal.js'
import { roundHalfUp } from '../rules'
import type {
  ClassEvaluationSummary,
  CloStat,
  CourseConfig,
  PloStat,
  ProcessedStudentResult
} from '../types'

/**
 * Thống kê tỷ lệ Đạt/Không đạt, Min, Max, TB cho từng CLO, PLO và điểm HP toàn lớp
 */
export function calculateClassSummary(
  config: CourseConfig,
  students: ProcessedStudentResult[]
): ClassEvaluationSummary {
  const rules = config.quyTac
  const totalStudents = students.length

  const evaluatedStudents = students.filter((s) => !s.isAbsentFinal).length
  const absentStudents = students.filter((s) => s.isAbsentFinal).length
  const missingDataStudents = students.filter((s) => s.hasMissingData).length

  // Thống kê từng CLO
  const cloStats: Record<string, CloStat> = {}
  for (const clo of config.cloList) {
    const cloCode = clo.maClo
    const scores = students.map((s) => s.cloScores[cloCode] ?? 0)

    const passedCount = scores.filter((s) => s >= rules.nguong_dat_clo).length
    const failedCount = totalStudents - passedCount
    const passedPercent =
      totalStudents > 0 ? roundHalfUp((passedCount / totalStudents) * 100, 1) : 0
    const failedPercent = totalStudents > 0 ? roundHalfUp(100 - passedPercent, 1) : 0

    const sumScore = scores.reduce((acc, s) => acc.add(s), new Decimal(0))
    const mean = totalStudents > 0 ? roundHalfUp(sumScore.div(totalStudents).toNumber(), 1) : 0
    const min = scores.length > 0 ? Math.min(...scores) : 0
    const max = scores.length > 0 ? Math.max(...scores) : 0

    cloStats[cloCode] = {
      maClo: cloCode,
      passedCount,
      passedPercent,
      failedCount,
      failedPercent,
      mean,
      min,
      max,
      isBelowThreshold: passedPercent < 50 // Bật cờ cảnh báo nếu tỉ lệ đạt < 50%
    }
  }

  // Thống kê từng PLO
  const ploSet = new Set(config.maTranPlo.map((p) => p.plo))
  const ploStats: Record<string, PloStat> = {}
  for (const ploCode of ploSet) {
    const scores = students.map((s) => s.ploScores[ploCode] ?? 0)

    const passedCount = scores.filter((s) => s >= rules.nguong_dat_plo).length
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

  // Thống kê Điểm học phần
  const courseScores = students.map((s) => s.courseScore)
  const passedHpCount = courseScores.filter((s) => s >= rules.nguong_dat_hp).length
  const failedHpCount = totalStudents - passedHpCount
  const passedHpPercent =
    totalStudents > 0 ? roundHalfUp((passedHpCount / totalStudents) * 100, 1) : 0
  const failedHpPercent = totalStudents > 0 ? roundHalfUp(100 - passedHpPercent, 1) : 0

  const sumHp = courseScores.reduce((acc, s) => acc.add(s), new Decimal(0))
  const meanHp = totalStudents > 0 ? roundHalfUp(sumHp.div(totalStudents).toNumber(), 1) : 0
  const minHp = courseScores.length > 0 ? Math.min(...courseScores) : 0
  const maxHp = courseScores.length > 0 ? Math.max(...courseScores) : 0

  const generalWarnings: string[] = []
  if (totalStudents < 30) {
    generalWarnings.push(`Quy mô lớp N = ${totalStudents} < 30 sinh viên.`)
  }
  if (missingDataStudents > 0) {
    generalWarnings.push(`Có ${missingDataStudents} sinh viên chưa nhập đủ điểm.`)
  }
  if (absentStudents > 0) {
    generalWarnings.push(
      `Có ${absentStudents} sinh viên vắng thi cuối kỳ (đã tính vào mẫu số tỷ lệ đạt với điểm 0).`
    )
  }

  return {
    totalStudents,
    evaluatedStudents,
    absentStudents,
    missingDataStudents,
    cloStats,
    ploStats,
    courseStat: {
      passedCount: passedHpCount,
      passedPercent: passedHpPercent,
      failedCount: failedHpCount,
      failedPercent: failedHpPercent,
      mean: meanHp,
      min: minHp,
      max: maxHp
    },
    generalWarnings
  }
}
