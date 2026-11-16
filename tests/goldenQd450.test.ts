/**
 * MASTER GOLDEN TEST SUITE - BỘ KIỂM THỬ CHUẨN T5 ĐẾN T12
 * Căn cứ: QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024 (Trường Đại học Thành Đông)
 *
 * Toàn bộ số liệu dưới đây đã được tính toán độc lập và đối chiếu trùng khớp 100% với văn bản QĐ450.
 * Engine chỉ được coi là đạt chuẩn khi toàn bộ các test case này chạy xanh.
 */

import { describe, it, expect } from 'vitest'
import {
  roundHalfUp,
  roundStep,
  calculateEvaluation,
  calculateGroupScores,
  calculatePhaseCloScores,
  numberToWordsVi
} from '@core/index'
import {
  GOLDEN_HUNG,
  GOLDEN_ROUNDING,
  GOLDEN_T11,
  HUNG_COURSE,
  HUNG_SCORE_RECORD,
  HUNG_STUDENT_ROW
} from './fixtures/goldenQd450Data'

describe('BỘ TEST CHUẨN GOLDEN TESTS (QĐ 450/QĐ-ĐHTĐ)', () => {
  // -----------------------------------------------------------
  // T5 - T9, T12: Tính toán toàn diện cho SV Nguyễn Văn Hùng
  // -----------------------------------------------------------
  describe('Dữ liệu sinh viên Nguyễn Văn Hùng (QĐ450 tr.32–33)', () => {
    const evalResult = calculateEvaluation(
      HUNG_COURSE,
      [HUNG_STUDENT_ROW.sinhVien],
      [HUNG_SCORE_RECORD]
    )
    const hung = evalResult.sinhVien[0]
    const processClos = calculatePhaseCloScores(HUNG_COURSE, hung.dotDanhGia, 'process')
    const finalClos = calculatePhaseCloScores(HUNG_COURSE, hung.dotDanhGia, 'final')
    const groupScores = calculateGroupScores(HUNG_COURSE, hung.dotDanhGia)
    const cloScore = (maClo: string): number | undefined =>
      hung.clo.find((c) => c.cloId === maClo)?.diem
    const ploScore = (maPlo: string): number | undefined =>
      hung.plo.find((p) => p.ploId === maPlo)?.diem

    it('T5: Điểm CLO thành phần Quá trình của Hùng (tr.32-33)', () => {
      // 8.8 / 7.5 / 6.3 / 7.3 / 6.7 / 5.0 / 7.5
      expect(processClos['CLO3.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO3.1'])
      expect(processClos['CLO1.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.1'])
      expect(processClos['CLO1.2']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.2'])
      expect(processClos['CLO1.3']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.3'])
      expect(processClos['CLO1.4']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO1.4'])
      expect(processClos['CLO2.1']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO2.1'])
      expect(processClos['CLO2.2']).toBe(GOLDEN_HUNG.processScores.clo_quatrinh['CLO2.2'])
      expect(groupScores.groupScores.CC.score).toBe(GOLDEN_HUNG.processScores.c_cc)
      expect(groupScores.groupScores.GK.score).toBe(GOLDEN_HUNG.processScores.c_gk)
    })

    it('T6: Điểm CLO thành phần Cuối kỳ của Hùng (tr.32)', () => {
      // 7.1 / 6.0 / 7.3 / 5.0 / 7.5 / 2.5 (TB 5.9)
      expect(finalClos['CLO1.1']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.1'])
      expect(finalClos['CLO1.2']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.2'])
      expect(finalClos['CLO1.3']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.3'])
      expect(finalClos['CLO1.4']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO1.4'])
      expect(finalClos['CLO2.1']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO2.1'])
      expect(finalClos['CLO2.2']).toBe(GOLDEN_HUNG.finalScores.clo_cuoiky['CLO2.2'])
      expect(groupScores.groupScores.CK.score).toBe(GOLDEN_HUNG.finalScores.c_ck)
    })

    it('T7: CLO cả học phần và TBC CLO = 6.6 (tr.32-33)', () => {
      // CLO1.1…CLO3.1 = 7.3 / 6.1 / 7.3 / 5.6 / 6.6 / 4.4 / 8.8
      expect(cloScore('CLO1.1')).toBe(GOLDEN_HUNG.courseClos['CLO1.1'])
      expect(cloScore('CLO1.2')).toBe(GOLDEN_HUNG.courseClos['CLO1.2'])
      expect(cloScore('CLO1.3')).toBe(GOLDEN_HUNG.courseClos['CLO1.3'])
      expect(cloScore('CLO1.4')).toBe(GOLDEN_HUNG.courseClos['CLO1.4'])
      expect(cloScore('CLO2.1')).toBe(GOLDEN_HUNG.courseClos['CLO2.1'])
      expect(cloScore('CLO2.2')).toBe(GOLDEN_HUNG.courseClos['CLO2.2'])
      expect(cloScore('CLO3.1')).toBe(GOLDEN_HUNG.courseClos['CLO3.1'])

      // TBC CLO = 6.6
      expect(hung.tbcClo).toBe(GOLDEN_HUNG.expectedTbcClo)
      expect(numberToWordsVi(hung.tbcClo, 1, true)).toBe('Sáu phẩy sáu')
    })

    it('T8: Điểm học phần theo QD450 = 6.7 (tr.32-33)', () => {
      // 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
      expect(hung.diemHocPhanQd450).toBe(GOLDEN_HUNG.expectedHpQd450)
      expect(hung.diemHocPhan).toBe(GOLDEN_HUNG.expectedHpQd450)
    })

    it('T9: PLO thành phần của Hùng (tr.33)', () => {
      // PLO3 = 6.6; PLO5 = 6.6; PLO6 = 4.4; PLO9 = 8.8
      expect(ploScore('PLO3')).toBe(GOLDEN_HUNG.expectedPlos['PLO3'])
      expect(ploScore('PLO5')).toBe(GOLDEN_HUNG.expectedPlos['PLO5'])
      expect(ploScore('PLO6')).toBe(GOLDEN_HUNG.expectedPlos['PLO6'])
      expect(ploScore('PLO9')).toBe(GOLDEN_HUNG.expectedPlos['PLO9'])
    })

    it('T12: TB quá trình của Hùng (tr.32) = 7.8', () => {
      // (8.8 + 6.7) / 2 = 7.75 -> 7.8 (chế độ chain)
      expect(hung.diemQuaTrinh).toBe(GOLDEN_HUNG.expectedTbQuaTrinh)
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
