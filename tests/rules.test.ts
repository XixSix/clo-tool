import { describe, it, expect } from 'vitest'
import {
  roundHalfUp,
  roundStep,
  DEFAULT_BUSINESS_RULES
} from '@core/rules'

describe('Rules & Math Module', () => {
  describe('Làm tròn HALF_UP bằng decimal.js', () => {
    it('phải làm tròn lên chính xác khi đúng nửa (.x5)', () => {
      expect(roundHalfUp(6.25, 1)).toBe(6.3)
      expect(roundHalfUp(8.75, 1)).toBe(8.8)
      expect(roundHalfUp(7.75, 1)).toBe(7.8)
      expect(roundHalfUp(5.75, 1)).toBe(5.8)
    })

    it('phải làm tròn đúng các số không đúng nửa', () => {
      expect(roundHalfUp(6.24, 1)).toBe(6.2)
      expect(roundHalfUp(6.26, 1)).toBe(6.3)
      expect(roundHalfUp(10.0, 1)).toBe(10.0)
      expect(roundHalfUp(0.0, 1)).toBe(0.0)
    })

    it('phải xử lý an toàn giá trị null/undefined/NaN', () => {
      // @ts-expect-error test fallback
      expect(roundHalfUp(null, 1)).toBe(0)
      // @ts-expect-error test fallback
      expect(roundHalfUp(undefined, 1)).toBe(0)
      expect(roundHalfUp(NaN, 1)).toBe(0)
    })
  })

  describe('Chế độ làm tròn chain vs final_only', () => {
    it('chế độ chain phải làm tròn ngay ở bước trung gian', () => {
      expect(roundStep(6.254, 'chain', 1)).toBe(6.3)
    })

    it('chế độ final_only phải giữ nguyên số gốc', () => {
      expect(roundStep(6.254, 'final_only', 1)).toBe(6.254)
    })
  })

  describe('Quy tắc nghiệp vụ mặc định', () => {
    it('phải cài đặt đúng 8 quyết định nghiệp vụ đã chốt', () => {
      expect(DEFAULT_BUSINESS_RULES.phuongThucTinhHp).toBe('QD450')
      expect(DEFAULT_BUSINESS_RULES.nguongDatClo).toBe(4.0)
      expect(DEFAULT_BUSINESS_RULES.nguongDatPlo).toBe(4.0)
      expect(DEFAULT_BUSINESS_RULES.cachTinhCloBoPhan).toBe('mean_of_ratios')
      expect(DEFAULT_BUSINESS_RULES.cheDoLamTron).toBe('chain')
      expect(DEFAULT_BUSINESS_RULES.tinhSvVangThi).toBe(true)
      expect(DEFAULT_BUSINESS_RULES.canhBaoCcDonLe).toBe(true)
      expect(DEFAULT_BUSINESS_RULES.tyLeNhom27).toBe(0.27)
      expect(DEFAULT_BUSINESS_RULES.nguongCoMauN).toBe(30)
    })
  })
})
