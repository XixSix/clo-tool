import { describe, it, expect } from 'vitest'
import { CORE_VERSION } from '@core/index'

describe('Smoke Test - Hạ tầng Core & Vitest', () => {
  it('phải import được hằng số CORE_VERSION từ src/core', () => {
    expect(CORE_VERSION).toBe('1.0.0')
  })

  it('phải hoạt động với phép tính số học cơ bản', () => {
    expect(1 + 1).toBe(2)
  })
})
