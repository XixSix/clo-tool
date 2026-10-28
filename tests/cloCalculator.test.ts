import { describe, it, expect } from 'vitest'
import { calculateEvaluation } from '@core/index'
import { GOLDEN_HUNG, HUNG_COURSE_CONFIG, HUNG_STUDENT_ROW } from './fixtures/goldenQd450Data'
import type { CourseConfig, RawStudentRow } from '@core/types'

describe('CLO Calculator Engine', () => {
  describe('Tính toán đầy đủ cho Sinh viên Nguyễn Văn Hùng (QĐ450 tr.32–33)', () => {
    const result = calculateEvaluation(HUNG_COURSE_CONFIG, [HUNG_STUDENT_ROW])
    const hung = result.students[0]

    it('T5: Điểm CLO thành phần Quá trình phải khớp chính xác', () => {
      // CLO thành phần quá trình: 8.8 / 7.5 / 6.3 / 7.3 / 6.7 / 5.0 / 7.5
      expect(hung.processCloScores['CLO1.1']).toBe(7.5)
      expect(hung.processCloScores['CLO1.2']).toBe(6.3)
      expect(hung.processCloScores['CLO1.3']).toBe(7.3)
      expect(hung.processCloScores['CLO1.4']).toBe(6.7)
      expect(hung.processCloScores['CLO2.1']).toBe(5.0)
      expect(hung.processCloScores['CLO2.2']).toBe(7.5)
      expect(hung.processCloScores['CLO3.1']).toBe(8.8)
    })

    it('T6: Điểm CLO thành phần Cuối kỳ phải khớp chính xác', () => {
      // 7.1 / 6.0 / 7.3 / 5.0 / 7.5 / 2.5 (TB 5.9)
      expect(hung.finalCloScores['CLO1.1']).toBe(7.1)
      expect(hung.finalCloScores['CLO1.2']).toBe(6.0)
      expect(hung.finalCloScores['CLO1.3']).toBe(7.3)
      expect(hung.finalCloScores['CLO1.4']).toBe(5.0)
      expect(hung.finalCloScores['CLO2.1']).toBe(7.5)
      expect(hung.finalCloScores['CLO2.2']).toBe(2.5)
      expect(hung.groupScores.CK.score).toBe(5.9)
    })

    it('T7: Điểm CLO cả học phần & TBC CLO phải khớp chính xác', () => {
      // CLO1.1…CLO3.1 = 7.3 / 6.1 / 7.3 / 5.6 / 6.6 / 4.4 / 8.8
      expect(hung.cloScores['CLO1.1']).toBe(7.3)
      expect(hung.cloScores['CLO1.2']).toBe(6.1)
      expect(hung.cloScores['CLO1.3']).toBe(7.3)
      expect(hung.cloScores['CLO1.4']).toBe(5.6)
      expect(hung.cloScores['CLO2.1']).toBe(6.6)
      expect(hung.cloScores['CLO2.2']).toBe(4.4)
      expect(hung.cloScores['CLO3.1']).toBe(8.8)

      // TBC CLO = 6.6
      expect(hung.tbcClo).toBe(GOLDEN_HUNG.expectedTbcClo)
      expect(hung.tbcCloInWords).toBe('Sáu phẩy sáu')
    })

    it('T12: TB quá trình của Hùng (tr.32) phải ra 7.8', () => {
      // (8.8 + 6.7) / 2 = 7.75 -> 7.8 (chế độ chain)
      expect(hung.tbQuaTrinh).toBe(7.8)
    })

    it('T8: Điểm học phần theo QD450 phải ra 6.7', () => {
      // 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
      expect(hung.courseScoreQd450).toBe(6.7)
      expect(hung.courseScore).toBe(6.7)
      expect(hung.isPassedHp).toBe(true)
    })

    it('T9: PLO thành phần phải khớp chính xác', () => {
      expect(hung.ploScores['PLO3']).toBe(6.6)
      expect(hung.ploScores['PLO5']).toBe(6.6)
      expect(hung.ploScores['PLO6']).toBe(4.4)
      expect(hung.ploScores['PLO9']).toBe(8.8)
    })

    it('Đối soát phương pháp cũ RAW_POINTS và cảnh báo', () => {
      // Hùng theo điểm thô ra ~6.9-7.0 (lệch >= 0.1 so với 6.7)
      expect(hung.courseScoreRawPoints).toBeGreaterThanOrEqual(6.9)
      expect(hung.scoreDifferenceWarning).toBeDefined()
      expect(hung.scoreDifferenceWarning).toContain('lệch')
    })
  })

  describe('Sinh viên vắng thi và các trường hợp đặc biệt', () => {
    it('SV vắng thi cuối kỳ (VT) phải bị điểm 0 cuối kỳ và đánh dấu vắng', () => {
      const absentStudent: RawStudentRow = {
        student: {
          tt: 2,
          maSv: 'SV_ABSENT',
          ho: 'Trần Văn',
          ten: 'Vắng',
          hoTen: 'Trần Văn Vắng'
        },
        scores: {
          diemCacCot: {
            CC: 10,
            TH: 10,
            'KT1_1.1': 8,
            'KT1_1.2': 8,
            'KT1_1.3': 8,
            'KT2_1.4': 8,
            'KT2_2.1': 8,
            'KT2_2.2': 8,
            'CK_1.1': 'VT',
            'CK_1.2': 'VT',
            'CK_1.3': 'VT',
            'CK_1.4': 'VT',
            'CK_2.1': 'VT',
            'CK_2.2': 'VT'
          }
        }
      }

      const res = calculateEvaluation(HUNG_COURSE_CONFIG, [absentStudent])
      const st = res.students[0]

      expect(st.isAbsentFinal).toBe(true)
      expect(st.groupScores.CK.score).toBe(0)
      // Điểm học phần: 0.2*10 + 0.3*8 + 0.5*0 = 4.4
      expect(st.courseScore).toBe(4.4)
    })

    it('Học phần thực hành tính điểm theo trọng số CLO', () => {
      const thucHanhConfig: CourseConfig = {
        ...HUNG_COURSE_CONFIG,
        courseInfo: {
          ...HUNG_COURSE_CONFIG.courseInfo,
          loaiHp: 'thuc_hanh'
        }
      }

      const res = calculateEvaluation(thucHanhConfig, [HUNG_STUDENT_ROW])
      const st = res.students[0]
      // Học phần thực hành lấy điểm HP bằng TBC có trọng số của các CLO
      expect(st.courseScore).toBe(st.tbcClo)
    })
  })
})
