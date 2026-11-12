/**
 * Dấu vân tay của Config, dùng để phát hiện Config bị đổi giữa 2 giai đoạn.
 *
 * Chỉ dùng JSON ổn định (object key được sắp xếp) — không cần crypto vì mục đích
 * duy nhất là so sánh bằng/khác giữa snapshot quá trình và Config hiện tại.
 */

import type { CourseConfig } from '../types'

const SIGNED_KEYS = [
  'courseInfo',
  'cloList',
  'keHoachDanhGia',
  'cauHoi',
  'maTranPlo',
  'diemDanh',
  'quyTac'
] as const

export function configSignature(config: CourseConfig): string {
  const payload: Record<string, unknown> = {}
  for (const key of SIGNED_KEYS) {
    payload[key] = config[key] ?? null
  }
  return stableStringify(payload)
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const keys = Object.keys(record).sort()
    const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    return `{${entries.join(',')}}`
  }
  return JSON.stringify(value)
}
