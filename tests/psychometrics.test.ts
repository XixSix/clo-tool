import { describe, it, expect } from 'vitest'
import {
  aggregateQuestions,
  calculateCronbachAlpha,
  calculateCronbachAlphaFromVariances,
  calculateExamPsychometrics,
  sampleVariance,
  type QuestionScoreEntry
} from '@core/index'
import { roundHalfUp } from '@core/rules'
import { GOLDEN_T4 } from './fixtures/goldenQd450Data'
import type { ExamQuestion } from '@core/types'

describe('Psychometrics Module', () => {
  describe('Phương sai mẫu (sample variance)', () => {
    it('phải tính phương sai mẫu chia cho N - 1 chính xác', () => {
      const v = [2, 4, 4, 4, 5, 5, 7, 9]
      // Mean = 5, sum diff sq = 9+1+1+1+0+0+4+16 = 32. N-1 = 7. Var = 32/7 = 4.5714...
      expect(sampleVariance(v)).toBeCloseTo(4.5714, 4)
    })

    it('trả về 0 nếu mảng <= 1 phần tử', () => {
      expect(sampleVariance([])).toBe(0)
      expect(sampleVariance([5])).toBe(0)
    })
  })

  describe('Độ tin cậy Cronbach alpha (Test T4)', () => {
    it('phải tính alpha trùng khớp số liệu QĐ450 Ví dụ 5 (tr.7-8)', () => {
      // Ví dụ 5: 5 câu hỏi, tổng phương sai câu = 0.8548, phương sai tổng = 1.7667
      const alpha = calculateCronbachAlphaFromVariances(
        GOLDEN_T4.numQuestions,
        GOLDEN_T4.sumQuestionVariance,
        GOLDEN_T4.totalScoreVariance
      )

      expect(alpha).toBeCloseTo(0.6452, 3)
      expect(roundHalfUp(alpha, 2)).toBe(GOLDEN_T4.expectedAlpha)
    })

    it('tính đúng Cronbach alpha từ ma trận điểm thực tế', () => {
      const matrix = [
        [3, 2, 2],
        [3, 3, 2],
        [2, 2, 1],
        [1, 1, 0]
      ]
      const res = calculateCronbachAlpha(matrix)
      expect(res.alpha).toBeGreaterThan(0)
      expect(res.itemVariances).toHaveLength(3)
    })

    it('xử lý an toàn khi phương sai tổng = 0', () => {
      const allSame = [
        [2, 2],
        [2, 2],
        [2, 2]
      ]
      const res = calculateCronbachAlpha(allSame)
      expect(res.alpha).toBe(0)
    })
  })

  describe('Gộp câu hỏi (sub-items aggregation)', () => {
    it('phải gộp đúng các câu 3a, 3b thành Câu 3 với tổng điểm tối đa', () => {
      const questions: ExamQuestion[] = [
        { id: 'C1', cau: 'Câu 1', cloId: 'CLO1', diemToiDa: 2 },
        { id: 'C3a', cau: 'Câu 3', cloId: 'CLO2', diemToiDa: 1.5 },
        { id: 'C3b', cau: 'Câu 3', cloId: 'CLO3', diemToiDa: 1.5 }
      ]

      const agg = aggregateQuestions(questions)
      expect(agg).toHaveLength(2)
      expect(agg[0].cau).toBe('Câu 1')
      expect(agg[0].diemToiDa).toBe(2)

      expect(agg[1].cau).toBe('Câu 3')
      expect(agg[1].diemToiDa).toBe(3)
      expect(agg[1].cotGoc).toEqual(['C3a', 'C3b'])
    })
  })

  describe('Độ khó p, độ phân biệt d và loại trừ sinh viên vắng thi', () => {
    it('phải tính đúng độ khó p và độ phân biệt d cho bài thi', () => {
      // 15 sinh viên, 2 câu hỏi (max: Câu 1 = 1đ, Câu 2 = 2đ)
      const questions: ExamQuestion[] = [
        { id: 'Q1', cau: 'Câu 1', cloId: 'CLO1', diemToiDa: 1 },
        { id: 'Q2', cau: 'Câu 2', cloId: 'CLO2', diemToiDa: 2 }
      ]

      // 4 SV top: điểm Q1 đều = 1 (topMean = 1)
      // 4 SV bottom: 2 đúng Q1 = 1, 2 sai Q1 = 0 (bottomMean = 0.5)
      // d(Q1) = (1 - 0.5) / 1 = 0.5 (Khớp Test T2)
      const rows: Array<{ maSv: string; q1: number | 'VT'; q2: number | 'VT' }> = [
        // Top 4 SV
        { maSv: 'SV01', q1: 1, q2: 2 },
        { maSv: 'SV02', q1: 1, q2: 2 },
        { maSv: 'SV03', q1: 1, q2: 2 },
        { maSv: 'SV04', q1: 1, q2: 2 },
        // Mid 7 SV
        { maSv: 'SV05', q1: 1, q2: 1 },
        { maSv: 'SV06', q1: 1, q2: 1 },
        { maSv: 'SV07', q1: 1, q2: 1 },
        { maSv: 'SV08', q1: 0, q2: 1 },
        { maSv: 'SV09', q1: 0, q2: 1 },
        { maSv: 'SV10', q1: 0, q2: 1 },
        { maSv: 'SV11', q1: 1, q2: 0 },
        // Bottom 4 SV
        { maSv: 'SV12', q1: 1, q2: 0 },
        { maSv: 'SV13', q1: 1, q2: 0 },
        { maSv: 'SV14', q1: 0, q2: 0 },
        { maSv: 'SV15', q1: 0, q2: 0 },
        // 1 SV vắng thi -> phải bị loại khỏi mẫu tính p, d, alpha
        { maSv: 'SV16', q1: 'VT', q2: 'VT' }
      ]

      const entries: QuestionScoreEntry[] = rows.map((row) => ({
        maSv: row.maSv,
        deId: 'ALL',
        diemTheoCau: [
          { questionId: 'Q1', diem: row.q1 },
          { questionId: 'Q2', diem: row.q2 }
        ]
      }))

      const examResult = calculateExamPsychometrics('CK', 'ALL', questions, entries, 0.27, 30)

      expect(examResult.soSinhVien).toBe(15) // SV16 vắng thi bị loại
      expect(examResult.items).toHaveLength(2)

      const item1 = examResult.items[0]
      expect(item1.cau).toBe('Câu 1')
      expect(item1.doPhanBietD).toBe(0.5) // Khớp Golden Test T2
      expect(item1.mucDoPhanBiet).toBe('Tốt')

      // Cảnh báo cỡ mẫu N < 30
      expect(examResult.canhBaoCoMauN).toBeDefined()
      expect(examResult.canhBaoCoMauN).toContain('Cỡ mẫu N = 15 < 30')
    })
  })
})
