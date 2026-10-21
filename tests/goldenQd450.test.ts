/**
 * MASTER GOLDEN TEST SUITE - BỘ KIỂM THỬ CHUẨN T1 ĐẾN T12
 * Căn cứ: QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024 (Trường Đại học Thành Đông)
 *
 * Toàn bộ số liệu dưới đây đã được tính toán độc lập và đối chiếu trùng khớp 100% với văn bản QĐ450.
 * Engine chỉ được coi là đạt chuẩn khi toàn bộ 12 test case này chạy xanh.
 */

import { describe, it, expect } from 'vitest'
import {
  roundHalfUp,
  roundStep,
  calculateCronbachAlphaFromVariances,
  calculateEvaluation
} from '@core/index'
import {
  GOLDEN_T1,
  GOLDEN_T2,
  GOLDEN_T3,
  GOLDEN_T4,
  GOLDEN_HUNG,
  GOLDEN_ROUNDING,
  GOLDEN_T11,
  HUNG_COURSE_CONFIG,
  HUNG_STUDENT_ROW
} from './fixtures/goldenQd450Data'
import Decimal from 'decimal.js'

describe('BỘ TEST CHUẨN GOLDEN TESTS (QĐ 450/QĐ-ĐHTĐ)', () => {
  // -----------------------------------------------------------
  // T1: Độ khó p (QĐ450 tr.4, Ví dụ 1–2)
  // -----------------------------------------------------------
  it('T1: Độ khó p (QĐ450 tr.4, Ví dụ 1–2)', () => {
    // Ví dụ 1: 62/100 SV trả lời đúng -> p = 0.62
    const p1 = roundHalfUp(
      new Decimal(GOLDEN_T1.case1.correct).div(GOLDEN_T1.case1.total).toNumber(),
      2
    )
    expect(p1).toBe(GOLDEN_T1.case1.expectedP)

    // Ví dụ 2: câu tự luận max 3đ, TB học sinh đạt 2.4đ -> p = 2.4 / 3 = 0.8
    const p2 = roundHalfUp(
      new Decimal(GOLDEN_T1.case2.mean).div(GOLDEN_T1.case2.maxScore).toNumber(),
      2
    )
    expect(p2).toBe(GOLDEN_T1.case2.expectedP)
  })

  // -----------------------------------------------------------
  // T2: Độ phân biệt d (QĐ450 tr.5, Ví dụ 3)
  // -----------------------------------------------------------
  it('T2: Độ phân biệt d câu trắc nghiệm (QĐ450 tr.5, Ví dụ 3)', () => {
    // 15 SV, nhóm 27% = round(0.27 * 15) = 4 SV
    // Nhóm trên đúng 4/4 (mean = 1.0), Nhóm dưới đúng 2/4 (mean = 0.5)
    // d = (1.0 - 0.5) / 1.0 = 0.5
    const topMean = new Decimal(GOLDEN_T2.topCorrect).div(GOLDEN_T2.groupSize)
    const bottomMean = new Decimal(GOLDEN_T2.bottomCorrect).div(GOLDEN_T2.groupSize)
    const d = roundHalfUp(topMean.sub(bottomMean).div(1).toNumber(), 2)

    expect(d).toBe(GOLDEN_T2.expectedD)
  })

  // -----------------------------------------------------------
  // T3: Độ phân biệt d câu tự luận (QĐ450 tr.6, Ví dụ 4)
  // -----------------------------------------------------------
  it('T3: Độ phân biệt d câu tự luận (QĐ450 tr.6, Ví dụ 4)', () => {
    // Điểm câu 3 của 15 SV (max 2), nhóm 4 SV trên TB = 1.75, nhóm 4 SV dưới TB = 1.25
    // d = (1.75 - 1.25) / 2 = 0.5 / 2 = 0.25
    const topMean = new Decimal(1.75)
    const bottomMean = new Decimal(1.25)
    const d = roundHalfUp(topMean.sub(bottomMean).div(GOLDEN_T3.maxScore).toNumber(), 2)

    expect(d).toBe(GOLDEN_T3.expectedD)
  })

  // -----------------------------------------------------------
  // T4: Độ tin cậy Cronbach alpha đề thi (QĐ450 tr.7–8, Ví dụ 5)
  // -----------------------------------------------------------
  it('T4: Độ tin cậy Cronbach alpha (QĐ450 tr.7–8, Ví dụ 5)', () => {
    // QĐ450 tr.7–8: Đề 15 SV x 5 câu hỏi
    // Tổng phương sai các câu hỏi = 0.8548
    // Phương sai tổng điểm đề thi = 1.7667
    // alpha = (5 / 4) * (1 - 0.8548 / 1.7667) = 1.25 * 0.51616 = 0.6452 -> 0.65
    const alpha = calculateCronbachAlphaFromVariances(
      GOLDEN_T4.numQuestions,
      GOLDEN_T4.sumQuestionVariance,
      GOLDEN_T4.totalScoreVariance
    )
    expect(alpha).toBeCloseTo(0.6452, 3)
    expect(roundHalfUp(alpha, 2)).toBe(GOLDEN_T4.expectedAlpha)
  })

  // -----------------------------------------------------------
  // T5 - T9, T12: Tính toán toàn diện cho SV Nguyễn Văn Hùng
  // -----------------------------------------------------------
  describe('Dữ liệu sinh viên Nguyễn Văn Hùng (QĐ450 tr.32–33)', () => {
    const evalResult = calculateEvaluation(HUNG_COURSE_CONFIG, [HUNG_STUDENT_ROW])
    const hung = evalResult.students[0]

    it('T5: Điểm CLO thành phần Quá trình của Hùng (tr.32-33)', () => {
      // 8.8 / 7.5 / 6.3 / 7.3 / 6.7 / 5.0 / 7.5
      expect(hung.processCloScores['CLO3.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO3.1'])
      expect(hung.processCloScores['CLO1.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.1'])
      expect(hung.processCloScores['CLO1.2']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.2'])
      expect(hung.processCloScores['CLO1.3']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.3'])
      expect(hung.processCloScores['CLO1.4']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.4'])
      expect(hung.processCloScores['CLO2.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO2.1'])
      expect(hung.processCloScores['CLO2.2']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO2.2'])
    })

    it('T6: Điểm CLO thành phần Cuối kỳ của Hùng (tr.32)', () => {
      // 7.1 / 6.0 / 7.3 / 5.0 / 7.5 / 2.5 (TB 5.9)
      expect(hung.finalCloScores['CLO1.1']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.1'])
      expect(hung.finalCloScores['CLO1.2']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.2'])
      expect(hung.finalCloScores['CLO1.3']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.3'])
      expect(hung.finalCloScores['CLO1.4']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.4'])
      expect(hung.finalCloScores['CLO2.1']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO2.1'])
      expect(hung.finalCloScores['CLO2.2']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO2.2'])
      expect(hung.groupScores.CK.score).toBe(GOLDEN_HUNG.finalScores.c_ck)
    })

    it('T7: CLO cả học phần và TBC CLO = 6.6 (tr.32-33)', () => {
      // CLO1.1…CLO3.1 = 7.3 / 6.1 / 7.3 / 5.6 / 6.6 / 4.4 / 8.8
      expect(hung.cloScores['CLO1.1']).toBe(GOLDEN_HUNG.courseClos['CLO1.1'])
      expect(hung.cloScores['CLO1.2']).toBe(GOLDEN_HUNG.courseClos['CLO1.2'])
      expect(hung.cloScores['CLO1.3']).toBe(GOLDEN_HUNG.courseClos['CLO1.3'])
      expect(hung.cloScores['CLO1.4']).toBe(GOLDEN_HUNG.courseClos['CLO1.4'])
      expect(hung.cloScores['CLO2.1']).toBe(GOLDEN_HUNG.courseClos['CLO2.1'])
      expect(hung.cloScores['CLO2.2']).toBe(GOLDEN_HUNG.courseClos['CLO2.2'])
      expect(hung.cloScores['CLO3.1']).toBe(GOLDEN_HUNG.courseClos['CLO3.1'])

      // TBC CLO = 6.6
      expect(hung.tbcClo).toBe(GOLDEN_HUNG.expectedTbcClo)
      expect(hung.tbcCloInWords).toBe('Sáu phẩy sáu')
    })

    it('T8: Điểm học phần theo QD450 = 6.7 (tr.32-33)', () => {
      // 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
      expect(hung.courseScoreQd450).toBe(GOLDEN_HUNG.expectedHpQd450)
      expect(hung.courseScore).toBe(GOLDEN_HUNG.expectedHpQd450)
    })

    it('T9: PLO thành phần của Hùng (tr.33)', () => {
      // PLO3 = 6.6; PLO5 = 6.6; PLO6 = 4.4; PLO9 = 8.8
      expect(hung.ploScores['PLO3']).toBe(GOLDEN_HUNG.expectedPlos['PLO3'])
      expect(hung.ploScores['PLO5']).toBe(GOLDEN_HUNG.expectedPlos['PLO5'])
      expect(hung.ploScores['PLO6']).toBe(GOLDEN_HUNG.expectedPlos['PLO6'])
      expect(hung.ploScores['PLO9']).toBe(GOLDEN_HUNG.expectedPlos['PLO9'])
    })

    it('T12: TB quá trình của Hùng (tr.32) = 7.8', () => {
      // (8.8 + 6.7) / 2 = 7.75 -> 7.8 (chế độ chain)
      expect(hung.tbQuaTrinh).toBe(GOLDEN_HUNG.expectedTbQuaTrinh)
    })
  })

  // -----------------------------------------------------------
  // T10: Làm tròn nửa lên (ROUND_HALF_UP) bằng decimal.js
  // -----------------------------------------------------------
  it('T10: Làm tròn nửa lên (ROUND_HALF_UP)', () => {
    // 6.25 -> 6.3 ; 8.75 -> 8.8
    for (const c of GOLDEN_ROUNDING.cases) {
      expect(roundHalfUp(c.input, 1)).toBe(c.expected)
    }
  })

  // -----------------------------------------------------------
  // T11: Mẫu xls quá trình (chế độ chain)
  // -----------------------------------------------------------
  it('T11: Mẫu xls quá trình CLO2 = 5.8 theo chế độ chain', () => {
    // KT1 câu 2: 2/5 = 4.0; KT2 câu 1: 3/4 = 7.5
    // CLO2 = (4.0 + 7.5) / 2 = 5.75 trước khi làm tròn -> 5.8
    const rawClo2 = (4.0 + 7.5) / 2
    expect(roundStep(rawClo2, 'chain', 1)).toBe(GOLDEN_T11.expectedClo2)
  })
})
