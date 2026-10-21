/**
 * Core Engine Điều phối Tính toán Điểm CLO, TBC CLO, Điểm Học phần và PLO
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * File này đóng vai trò orchestrator, tập hợp các sub-calculators từ ./calculator:
 * - cellScoreCalculator: Tính điểm ô s(j,k)
 * - cloScoreCalculator: Tính CLO cả học phần, quá trình, cuối kỳ, TBC CLO, điểm nhóm
 * - courseScoreCalculator: Tính điểm học phần (QD450 & RAW_POINTS), PLO
 * - studentCalculator: Đánh giá cho 1 sinh viên
 * - classSummaryCalculator: Thống kê tổng hợp toàn lớp
 */

import { calculateClassSummary, evaluateStudent } from './calculator'
import type { CourseConfig, EvaluationResult, ProcessedStudentResult, RawStudentRow } from './types'

// Re-export tất cả sub-calculators để các module khác hoặc test có thể dùng trực tiếp
export * from './calculator'

/**
 * Tính toán toàn bộ điểm số học phần, CLO, TBC CLO và PLO cho danh sách sinh viên
 */
export function calculateEvaluation(
  config: CourseConfig,
  students: RawStudentRow[]
): EvaluationResult {
  // Map cấu trúc câu hỏi theo mã đầu điểm & CLO: (maDauDiem, clo) -> QuestionColumn[]
  const cellQuestionsMap = new Map<string, typeof config.cauHoi>()
  for (const q of config.cauHoi) {
    const key = `${q.maDauDiem}_${q.clo}`
    const list = cellQuestionsMap.get(key) ?? []
    list.push(q)
    cellQuestionsMap.set(key, list)
  }

  // Đánh giá kết quả cho từng sinh viên
  const processedStudents: ProcessedStudentResult[] = students.map((st) =>
    evaluateStudent(st, config, cellQuestionsMap)
  )

  // Thống kê tổng hợp toàn lớp
  const summary = calculateClassSummary(config, processedStudents)

  return {
    students: processedStudents,
    summary,
    config
  }
}
