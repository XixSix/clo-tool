/**
 * Bảng phân loại p / d / α theo QĐ450 Điều 5 (dùng cho báo cáo phân tích đề thi).
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 */

import Decimal from 'decimal.js'
import type { DifficultyLevel, DiscriminationLevel, ReliabilityLevel } from '../types'

/**
 * Phân loại độ khó p (QĐ450 Điều 5.1):
 * - >= 0.8: Dễ
 * - 0.6 - < 0.8: Trung bình
 * - 0.4 - < 0.6: Tương đối khó
 * - 0.2 - < 0.4: Khó
 * - < 0.2: Rất khó
 */
export function classifyDifficulty(p: number): DifficultyLevel {
  const d = new Decimal(p)
  if (d.gte(0.8)) return 'Dễ'
  if (d.gte(0.6)) return 'Trung bình'
  if (d.gte(0.4)) return 'Tương đối khó'
  if (d.gte(0.2)) return 'Khó'
  return 'Rất khó'
}

/**
 * Phân loại độ phân biệt d (QĐ450 Điều 5.2):
 * - 0.7 <= d <= 1.0: Rất tốt
 * - 0.4 <= d < 0.7: Tốt
 * - 0.2 <= d < 0.4: Đủ độ phân biệt
 * - 0 <= d < 0.2: Yếu
 * - < 0: Nên loại bỏ
 */
export function classifyDiscrimination(d: number): DiscriminationLevel {
  const dec = new Decimal(d)
  if (dec.gte(0.7)) return 'Rất tốt'
  if (dec.gte(0.4)) return 'Tốt'
  if (dec.gte(0.2)) return 'Đủ độ phân biệt'
  if (dec.gte(0)) return 'Yếu'
  return 'Nên loại bỏ'
}

/**
 * Phân loại độ tin cậy Cronbach's alpha (QĐ450 Điều 5.3):
 * - >= 0.85: Rất cao
 * - 0.80 - < 0.85: Cao
 * - 0.70 - < 0.80: Đủ độ tin cậy
 * - 0.60 < alpha < 0.70: Yếu
 * - <= 0.60: Không đủ độ tin cậy
 */
export function classifyReliability(alpha: number): ReliabilityLevel {
  const a = new Decimal(alpha)
  if (a.gte(0.85)) return 'Rất cao'
  if (a.gte(0.8)) return 'Cao'
  if (a.gte(0.7)) return 'Đủ độ tin cậy'
  if (a.gt(0.6)) return 'Yếu'
  return 'Không đủ độ tin cậy'
}
