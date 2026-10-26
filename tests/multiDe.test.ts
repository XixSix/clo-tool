/**
 * Test bẫy bug ô điểm KHÔNG lọc câu hỏi theo mã đề của sinh viên.
 *
 * Cùng một đầu điểm "GK" có 2 đề D1/D2; mỗi SV chỉ làm một đề.
 * Trước khi sửa, calculateCellScores lấy toàn bộ câu hỏi của ô
 * (cả câu đề SV không làm) -> câu trống góp tỷ lệ 0 làm ô điểm bị sai.
 */

import { describe, it, expect } from 'vitest'
import { calculateEvaluation, validateConfig } from '@core/index'
import { buildMockMultiDeConfig, buildMockMultiDeStudents } from './fixtures/mockMultiDe'

const config = buildMockMultiDeConfig()
const students = buildMockMultiDeStudents()
const result = calculateEvaluation(config, students)
const [svA, svB, svC] = result.students

describe('Ô điểm lọc câu hỏi theo mã đề của SV (cùng đầu điểm, nhiều đề)', () => {
  it('fixture đa đề hợp lệ theo validator (không có lỗi)', () => {
    expect(validateConfig(config).filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('SV-A (maDe D1): chỉ tính 4 câu đề D1 -> GK–CLO1 = 8.0, GK–CLO2 = 6.0', () => {
    // Kỳ vọng nếu không lọc maDe: GK_CLO1 = mean(0.8, 0.8, 0, 0) * 10 = 4.0 (sai)
    expect(svA.cellScores['GK_CLO1']?.score).toBe(8)
    expect(svA.cellScores['GK_CLO2']?.score).toBe(6)
    expect(svA.cellScores['CC_CLO1']?.score).toBe(8)
  })

  it('SV-B (maDe D2): chỉ tính 4 câu đề D2 -> GK–CLO1 = 6.0, GK–CLO2 = 9.0', () => {
    expect(svB.cellScores['GK_CLO1']?.score).toBe(6)
    expect(svB.cellScores['GK_CLO2']?.score).toBe(9)
  })

  it('SV-C không khai maDe (~ ALL): mọi câu của cả 2 đề đều tính', () => {
    // GK_CLO1 = mean(2/2.5, 2/2.5, 2.5/2.5, 2.5/2.5) = 0.9 -> 9.0
    expect(svC.cellScores['GK_CLO1']?.score).toBe(9)
    expect(svC.cellScores['GK_CLO2']?.score).toBe(9)
  })

  it('câu đề SV không làm KHÔNG được gắn cờ thiếu dữ liệu', () => {
    // hasMissingData chỉ đúng khi câu thuộc đề của SV bị trống
    expect(svA.hasMissingData).toBe(false)
    expect(svB.hasMissingData).toBe(false)
    expect(svC.hasMissingData).toBe(false)
  })
})
