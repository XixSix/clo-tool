/**
 * Test bẫy bug ô điểm KHÔNG lọc câu hỏi theo mã đề của sinh viên.
 *
 * Cùng một đầu điểm "GK" có 2 đề D1/D2; mỗi SV chỉ làm một đề.
 * Trước khi sửa, calculateCellScores lấy toàn bộ câu hỏi của ô
 * (cả câu đề SV không làm) -> câu trống góp tỷ lệ 0 làm ô điểm bị sai.
 */

import { describe, it, expect } from 'vitest'
import { calculateEvaluation, cellScoreOf, validateCourse } from '@core/index'
import { buildMockMultiDeCourse, buildMockMultiDeData } from './fixtures/mockMultiDe'

const course = buildMockMultiDeCourse()
const { students, records } = buildMockMultiDeData()
const result = calculateEvaluation(course, students, records)
const [svA, svB, svC] = result.sinhVien

function gkCell(
  studentResult: (typeof result.sinhVien)[number],
  cloId: string
): number | undefined {
  const gk = studentResult.dotDanhGia.find((d) => d.dotDanhGiaId === 'GK')
  return gk ? cellScoreOf(gk, cloId) : undefined
}

describe('Ô điểm lọc câu hỏi theo mã đề của SV (cùng đầu điểm, nhiều đề)', () => {
  it('fixture đa đề hợp lệ theo validator (không có lỗi)', () => {
    expect(validateCourse(course).filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('SV-A (maDe D1): chỉ tính 4 câu đề D1 -> GK–CLO1 = 8.0, GK–CLO2 = 6.0', () => {
    // Kỳ vọng nếu không lọc maDe: GK_CLO1 = mean(0.8, 0.8, 0, 0) * 10 = 4.0 (sai)
    expect(gkCell(svA, 'CLO1')).toBe(8)
    expect(gkCell(svA, 'CLO2')).toBe(6)
    expect(svA.clo.find((c) => c.cloId === 'CLO1')?.diem).toBeDefined()
  })

  it('SV-B (maDe D2): chỉ tính 4 câu đề D2 -> GK–CLO1 = 6.0, GK–CLO2 = 9.0', () => {
    expect(gkCell(svB, 'CLO1')).toBe(6)
    expect(gkCell(svB, 'CLO2')).toBe(9)
  })

  it('SV-C không khai maDe (~ ALL): mọi câu của cả 2 đề đều tính', () => {
    // GK_CLO1 = mean(2/2.5, 2/2.5, 2.5/2.5, 2.5/2.5) = 0.9 -> 9.0
    expect(gkCell(svC, 'CLO1')).toBe(9)
    expect(gkCell(svC, 'CLO2')).toBe(9)
  })

  it('câu đề SV không làm KHÔNG được gắn cờ thiếu dữ liệu', () => {
    // thieuDuLieu chỉ đúng khi câu thuộc đề của SV bị trống
    expect(svA.thieuDuLieu).toBe(false)
    expect(svB.thieuDuLieu).toBe(false)
    expect(svC.thieuDuLieu).toBe(false)
  })
})
