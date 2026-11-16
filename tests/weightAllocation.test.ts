import { describe, expect, it } from 'vitest'
import { allocateIntegers, roundIntegers } from '../src/renderer/src/lib/weight-allocation'

describe('allocateIntegers', () => {
  it('phân bổ tổng đúng bằng target và giữ thứ tự', () => {
    const result = allocateIntegers([6.4, 5.5, 4.1], 15)
    expect(result).toHaveLength(3)
    expect(result.reduce((a, b) => a + b, 0)).toBe(15)
    expect(result[0]).toBeGreaterThanOrEqual(6)
    expect(result[1]).toBeGreaterThanOrEqual(5)
    expect(result[2]).toBeGreaterThanOrEqual(4)
  })

  it('tổng đúng 100 cho trọng số lẻ', () => {
    const result = allocateIntegers([33.33, 33.33, 33.34], 100)
    expect(result.reduce((a, b) => a + b, 0)).toBe(100)
    expect(result).toEqual([33, 33, 34])
  })

  it('trả mảng rỗng khi đầu vào rỗng', () => {
    expect(allocateIntegers([], 100)).toEqual([])
  })

  it('target 0 → toàn bộ bằng 0', () => {
    expect(allocateIntegers([10, 20, 30], 0)).toEqual([0, 0, 0])
  })

  it('phần tử 0 được giữ nguyên', () => {
    const result = allocateIntegers([0, 50, 50], 100)
    expect(result).toEqual([0, 50, 50])
  })
})

describe('roundIntegers', () => {
  it('làm tròn half-up từng phần tử', () => {
    expect(roundIntegers([12.4, 12.5, 12.6])).toEqual([12, 13, 13])
  })

  it('giữ mảng rỗng', () => {
    expect(roundIntegers([])).toEqual([])
  })
})
