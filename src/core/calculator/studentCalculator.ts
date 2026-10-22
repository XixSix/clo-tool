/**
 * Module điều phối quy trình đánh giá kết quả học tập cho 1 sinh viên
 */

import { calculateCellScores } from './cellScoreCalculator'
import { calculateCloScores, calculateGroupScores, calculateTbcClo } from './cloScoreCalculator'
import { calculateCourseScores, calculatePloScores } from './courseScoreCalculator'
import type { CourseConfig, ProcessedStudentResult, QuestionColumn, RawStudentRow } from '../types'

/**
 * Tính toán đầy đủ tất cả các chỉ số (cell scores, CLO, TBC CLO, điểm HP, PLO) cho 1 sinh viên
 */
export function evaluateStudent(
  student: RawStudentRow,
  config: CourseConfig,
  cellQuestionsMap: Map<string, QuestionColumn[]>
): ProcessedStudentResult {
  const mode = config.quyTac.rounding_mode ?? 'chain'

  // Bước 1: Tính s(j,k) cho từng ô
  const { cellScores, warnings, hasMissingData, isAbsentFinal } = calculateCellScores(
    student,
    config,
    cellQuestionsMap
  )

  // Bước 2: Tính CLO cả học phần, quá trình, cuối kỳ
  const { cloScores, processCloScores, finalCloScores } = calculateCloScores(config, cellScores)

  // Bước 3: Tính TBC CLO
  const { tbcClo, tbcCloInWords, sumWeightedClo, sumCloWeights } = calculateTbcClo(
    config.cloList,
    cloScores,
    mode
  )

  // Bước 4: Tính điểm nhóm C_cc, C_gk, C_ck và TB quá trình
  const { groupScores, tbQuaTrinh } = calculateGroupScores(config.keHoachDanhGia, cellScores, mode)

  // Bước 5: Tính điểm học phần QD450 và RAW_POINTS
  const {
    courseScore,
    courseScoreQd450,
    courseScoreRawPoints,
    scoreDifferenceWarning,
    isPassedHp
  } = calculateCourseScores(config, cellScores, groupScores, sumWeightedClo, sumCloWeights)

  if (scoreDifferenceWarning) {
    warnings.push(scoreDifferenceWarning)
  }

  // Bước 6: Tính điểm PLO thành phần
  const ploScores = calculatePloScores(config.maTranPlo, cloScores, mode)

  return {
    tt: student.tt,
    maSv: student.maSv,
    hoTen: student.hoTen,
    ngaySinh: student.ngaySinh,
    maDe: student.maDe,
    cellScores,
    processCloScores,
    finalCloScores,
    cloScores,
    groupScores,
    tbcClo,
    tbcCloInWords,
    tbQuaTrinh,
    courseScore,
    courseScoreQd450,
    courseScoreRawPoints,
    scoreDifferenceWarning,
    ploScores,
    isPassedHp,
    isAbsentFinal,
    hasMissingData,
    warnings
  }
}
