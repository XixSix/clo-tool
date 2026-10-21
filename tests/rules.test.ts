import { describe, it, expect } from 'vitest'
import {
  roundHalfUp,
  roundStep,
  classifyDifficulty,
  classifyDiscrimination,
  classifyReliability,
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

  describe('Phân loại chỉ số độ khó p', () => {
    it('phải phân loại đúng theo bảng QĐ450 Điều 5.1', () => {
      expect(classifyDifficulty(0.85)).toBe('Dễ')
      expect(classifyDifficulty(0.8)).toBe('Dễ')
      expect(classifyDifficulty(0.7)).toBe('Trung bình')
      expect(classifyDifficulty(0.6)).toBe('Trung bình')
      expect(classifyDifficulty(0.5)).toBe('Tương đối khó')
      expect(classifyDifficulty(0.4)).toBe('Tương đối khó')
      expect(classifyDifficulty(0.3)).toBe('Khó')
      expect(classifyDifficulty(0.2)).toBe('Khó')
      expect(classifyDifficulty(0.15)).toBe('Rất khó')
    })
  })

  describe('Phân loại chỉ số độ phân biệt d', () => {
    it('phải phân loại đúng theo bảng QĐ450 Điều 5.2', () => {
      expect(classifyDiscrimination(0.75)).toBe('Rất tốt')
      expect(classifyDiscrimination(0.7)).toBe('Rất tốt')
      expect(classifyDiscrimination(0.5)).toBe('Tốt')
      expect(classifyDiscrimination(0.4)).toBe('Tốt')
      expect(classifyDiscrimination(0.3)).toBe('Đủ độ phân biệt')
      expect(classifyDiscrimination(0.2)).toBe('Đủ độ phân biệt')
      expect(classifyDiscrimination(0.1)).toBe('Yếu')
      expect(classifyDiscrimination(0.0)).toBe('Yếu')
      expect(classifyDiscrimination(-0.15)).toBe('Nên loại bỏ')
    })
  })

  describe('Phân loại độ tin cậy Cronbach alpha', () => {
    it('phải phân loại đúng theo bảng QĐ450 Điều 5.3', () => {
      expect(classifyReliability(0.9)).toBe('Rất cao')
      expect(classifyReliability(0.85)).toBe('Rất cao')
      expect(classifyReliability(0.82)).toBe('Cao')
      expect(classifyReliability(0.8)).toBe('Cao')
      expect(classifyReliability(0.75)).toBe('Đủ độ tin cậy')
      expect(classifyReliability(0.7)).toBe('Đủ độ tin cậy')
      expect(classifyReliability(0.65)).toBe('Yếu')
      expect(classifyReliability(0.6)).toBe('Không đủ độ tin cậy')
      expect(classifyReliability(0.55)).toBe('Không đủ độ tin cậy')
    })
  })

  describe('Quy tắc nghiệp vụ mặc định', () => {
    it('phải cài đặt đúng 8 quyết định nghiệp vụ đã chốt', () => {
      expect(DEFAULT_BUSINESS_RULES.hp_method).toBe('QD450')
      expect(DEFAULT_BUSINESS_RULES.nguong_dat_clo).toBe(4.0)
      expect(DEFAULT_BUSINESS_RULES.nguong_dat_plo).toBe(4.0)
      expect(DEFAULT_BUSINESS_RULES.clo_bo_phan).toBe('mean_of_ratios')
      expect(DEFAULT_BUSINESS_RULES.rounding_mode).toBe('chain')
      expect(DEFAULT_BUSINESS_RULES.tinh_sv_vang_thi).toBe(true)
      expect(DEFAULT_BUSINESS_RULES.canh_bao_cc_don_le).toBe(true)
      expect(DEFAULT_BUSINESS_RULES.ty_le_nhom_27).toBe(0.27)
      expect(DEFAULT_BUSINESS_RULES.nguong_co_mau_n).toBe(30)
    })
  })
})
