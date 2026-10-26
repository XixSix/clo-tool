import { describe, it, expect } from 'vitest'
import { numberToWordsVi } from '@core/index'

describe('Number to Words Vietnamese Module', () => {
  it('phải giữ chữ phẩy không khi điểm tròn thang 10 (Chuẩn học vụ ĐH)', () => {
    expect(numberToWordsVi(6.0)).toBe('Sáu phẩy không')
    expect(numberToWordsVi(10.0)).toBe('Mười phẩy không')
    expect(numberToWordsVi(4.0)).toBe('Bốn phẩy không')
    expect(numberToWordsVi(0.0)).toBe('Không phẩy không')
  })

  it('phải đọc chính xác các điểm số lẻ 1 chữ số thập phân', () => {
    expect(numberToWordsVi(6.6)).toBe('Sáu phẩy sáu')
    expect(numberToWordsVi(6.7)).toBe('Sáu phẩy bảy')
    expect(numberToWordsVi(7.8)).toBe('Bảy phẩy tám')
    expect(numberToWordsVi(0.5)).toBe('Không phẩy năm')
    expect(numberToWordsVi(8.1)).toBe('Tám phẩy một')
    expect(numberToWordsVi(9.4)).toBe('Chín phẩy bốn')
  })

  it('phải hỗ trợ đọc 2 chữ số thập phân khi cần', () => {
    expect(numberToWordsVi(6.25, 2)).toBe('Sáu phẩy hai mươi lăm')
    expect(numberToWordsVi(8.75, 2)).toBe('Tám phẩy bảy mươi lăm')
    expect(numberToWordsVi(5.05, 2)).toBe('Năm phẩy không năm')
    expect(numberToWordsVi(7.15, 2)).toBe('Bảy phẩy mười lăm')
  })

  it('phải xử lý an toàn giá trị rỗng/không hợp lệ', () => {
    // @ts-expect-error test invalid input
    expect(numberToWordsVi(null)).toBe('')
    // @ts-expect-error test invalid input
    expect(numberToWordsVi(undefined)).toBe('')
    expect(numberToWordsVi(NaN)).toBe('')
  })
})
