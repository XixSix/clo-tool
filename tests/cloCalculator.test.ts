import { describe, it, expect } from 'vitest'
import {
  calculateEvaluation,
  calculateGroupScores,
  calculatePhaseCloScores,
  numberToWordsVi
} from '@core/index'
import {
  GOLDEN_HUNG,
  HUNG_COURSE,
  HUNG_SCORE_RECORD,
  HUNG_STUDENT_ROW
} from './fixtures/goldenQd450Data'
import type { Course, StudentCourseScoreRecord } from '@core/types'

const HUNG_STUDENT = HUNG_STUDENT_ROW.student

describe('CLO Calculator Engine', () => {
  describe('Tính toán đầy đủ cho Sinh viên Nguyễn Văn Hùng (QĐ450 tr.32–33)', () => {
    const result = calculateEvaluation(HUNG_COURSE, [HUNG_STUDENT], [HUNG_SCORE_RECORD])
    const hung = result.sinhVien[0]
    const processClos = calculatePhaseCloScores(HUNG_COURSE, hung.dotDanhGia, 'process')
    const finalClos = calculatePhaseCloScores(HUNG_COURSE, hung.dotDanhGia, 'final')
    const groupScores = calculateGroupScores(HUNG_COURSE, hung.dotDanhGia)
    const cloScore = (maClo: string): number | undefined =>
      hung.clo.find((c) => c.cloId === maClo)?.diem
    const ploScore = (maPlo: string): number | undefined =>
      hung.plo.find((p) => p.ploId === maPlo)?.diem

    it('T5: Điểm CLO thành phần Quá trình phải khớp chính xác', () => {
      // CLO thành phần quá trình: 8.8 / 7.5 / 6.3 / 7.3 / 6.7 / 5.0 / 7.5
      expect(processClos['CLO1.1']).toBe(7.5)
      expect(processClos['CLO1.2']).toBe(6.3)
      expect(processClos['CLO1.3']).toBe(7.3)
      expect(processClos['CLO1.4']).toBe(6.7)
      expect(processClos['CLO2.1']).toBe(5.0)
      expect(processClos['CLO2.2']).toBe(7.5)
      expect(processClos['CLO3.1']).toBe(8.8)
      expect(groupScores.groupScores.CC.score).toBe(8.8)
      expect(groupScores.groupScores.GK.score).toBe(6.7)
    })

    it('T6: Điểm CLO thành phần Cuối kỳ phải khớp chính xác', () => {
      // 7.1 / 6.0 / 7.3 / 5.0 / 7.5 / 2.5 (TB 5.9)
      expect(finalClos['CLO1.1']).toBe(7.1)
      expect(finalClos['CLO1.2']).toBe(6.0)
      expect(finalClos['CLO1.3']).toBe(7.3)
      expect(finalClos['CLO1.4']).toBe(5.0)
      expect(finalClos['CLO2.1']).toBe(7.5)
      expect(finalClos['CLO2.2']).toBe(2.5)
      expect(groupScores.groupScores.CK.score).toBe(5.9)
    })

    it('T7: Điểm CLO cả học phần & TBC CLO phải khớp chính xác', () => {
      // CLO1.1…CLO3.1 = 7.3 / 6.1 / 7.3 / 5.6 / 6.6 / 4.4 / 8.8
      expect(cloScore('CLO1.1')).toBe(7.3)
      expect(cloScore('CLO1.2')).toBe(6.1)
      expect(cloScore('CLO1.3')).toBe(7.3)
      expect(cloScore('CLO1.4')).toBe(5.6)
      expect(cloScore('CLO2.1')).toBe(6.6)
      expect(cloScore('CLO2.2')).toBe(4.4)
      expect(cloScore('CLO3.1')).toBe(8.8)

      // TBC CLO = 6.6
      expect(hung.tbcClo).toBe(GOLDEN_HUNG.expectedTbcClo)
      expect(numberToWordsVi(hung.tbcClo, 1, true)).toBe('Sáu phẩy sáu')
    })

    it('T12: TB quá trình của Hùng (tr.32) phải ra 7.8', () => {
      // (8.8 + 6.7) / 2 = 7.75 -> 7.8 (chế độ chain)
      expect(hung.diemQuaTrinh).toBe(7.8)
    })

    it('T8: Điểm học phần theo QD450 phải ra 6.7', () => {
      // 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
      expect(hung.diemHocPhanQd450).toBe(6.7)
      expect(hung.diemHocPhan).toBe(6.7)
      expect(hung.datHocPhan).toBe(true)
    })

    it('T9: PLO thành phần phải khớp chính xác', () => {
      expect(ploScore('PLO3')).toBe(6.6)
      expect(ploScore('PLO5')).toBe(6.6)
      expect(ploScore('PLO6')).toBe(4.4)
      expect(ploScore('PLO9')).toBe(8.8)
    })

    it('Đối soát phương pháp cũ RAW_POINTS và cảnh báo', () => {
      // Điểm thô = Σ điểm đợt × trọng số đợt (đã chuẩn hóa tổng 100%):
      // 0,02*10 + 0,02*7,5 + 0,18*7,033 + 0,18*6,4 + 0,6*5,9 = 6,308 -> 6.3
      // Lệch 0,4 so với QĐ450 (6.7) nên phải có cảnh báo.
      expect(hung.diemHocPhanRawPoints).toBe(6.3)
      const warning = hung.canhBao.find((issue) => issue.maLoi === 'SCORE_DIFFERENCE')
      expect(warning).toBeDefined()
      expect(warning?.noiDung).toContain('lệch')
    })
  })

  describe('Sinh viên vắng thi và các trường hợp đặc biệt', () => {
    it('SV vắng thi cuối kỳ (VT) phải bị điểm 0 cuối kỳ và đánh dấu vắng', () => {
      const absentStudent = {
        id: 'SV_ABSENT',
        tt: 2,
        maSv: 'SV_ABSENT',
        ho: 'Trần Văn',
        ten: 'Vắng',
        hoTen: 'Trần Văn Vắng'
      }
      const absentRecord: StudentCourseScoreRecord = {
        id: 'SV_ABSENT_KTLT101',
        sinhVienId: 'SV_ABSENT',
        hocPhanId: 'KTLT101',
        diemTheoDotDanhGia: [
          {
            cachNhapDiem: 'DIRECT_CLO_SCORE',
            dotDanhGiaId: 'CC',
            diemTheoClo: [{ cloId: 'CLO3.1', diem: 10 }]
          },
          {
            cachNhapDiem: 'DIRECT_CLO_SCORE',
            dotDanhGiaId: 'TH',
            diemTheoClo: [{ cloId: 'CLO3.1', diem: 10 }]
          },
          {
            cachNhapDiem: 'QUESTION_SCORE',
            dotDanhGiaId: 'KT1',
            deId: 'D1',
            diemTheoCau: [
              { questionId: 'KT1_1.1', diem: 8 },
              { questionId: 'KT1_1.2', diem: 8 },
              { questionId: 'KT1_1.3', diem: 8 }
            ]
          },
          {
            cachNhapDiem: 'QUESTION_SCORE',
            dotDanhGiaId: 'KT2',
            deId: 'D1',
            diemTheoCau: [
              { questionId: 'KT2_1.4', diem: 8 },
              { questionId: 'KT2_2.1', diem: 8 },
              { questionId: 'KT2_2.2', diem: 8 }
            ]
          },
          {
            cachNhapDiem: 'QUESTION_SCORE',
            dotDanhGiaId: 'CK',
            deId: 'D1',
            diemTheoCau: [
              { questionId: 'CK_1.1', diem: 'VT' },
              { questionId: 'CK_1.2', diem: 'VT' },
              { questionId: 'CK_1.3', diem: 'VT' },
              { questionId: 'CK_1.4', diem: 'VT' },
              { questionId: 'CK_2.1', diem: 'VT' },
              { questionId: 'CK_2.2', diem: 'VT' }
            ]
          }
        ]
      }

      const res = calculateEvaluation(HUNG_COURSE, [absentStudent], [absentRecord])
      const st = res.sinhVien[0]
      const groupScores = calculateGroupScores(HUNG_COURSE, st.dotDanhGia)

      expect(st.vangThiCuoiKy).toBe(true)
      expect(groupScores.groupScores.CK.score).toBe(0)
      // Điểm học phần: 0.2*10 + 0.3*8 + 0.5*0 = 4.4
      expect(st.diemHocPhan).toBe(4.4)
    })

    it('Học phần thực hành: C_hp = Σ CLO × trọng số CLO (tổng 100%)', () => {
      // Trọng số CLO: 20/10/10/10/20/10/20 (%) — tổng = 100
      const weights = [20, 10, 10, 10, 20, 10, 20]
      const thucHanhCourse: Course = {
        ...HUNG_COURSE,
        loaiHp: 'thuc_hanh',
        cloList: HUNG_COURSE.cloList.map((clo, i) => ({
          ...clo,
          trongSoClo: weights[i]
        }))
      }

      const res = calculateEvaluation(thucHanhCourse, [HUNG_STUDENT], [HUNG_SCORE_RECORD])
      const st = res.sinhVien[0]
      // CLO = 7.3/6.1/7.3/5.6/6.6/4.4/8.8
      // C_hp = 0.2*7.3 + 0.1*6.1 + 0.1*7.3 + 0.1*5.6 + 0.2*6.6 + 0.1*4.4 + 0.2*8.8 = 6.9
      expect(st.diemHocPhan).toBe(6.9)
    })
  })
})
