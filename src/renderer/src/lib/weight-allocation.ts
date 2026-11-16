/** Chia số thực thành số nguyên sao cho tổng đúng bằng `targetTotal` (largest remainder). */

export function allocateIntegers(values: number[], targetTotal: number): number[] {
  if (values.length === 0) return []

  const target = Math.max(0, Math.round(targetTotal))
  const safe = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0))
  const total = safe.reduce((sum, value) => sum + value, 0)

  if (total <= 0) {
    const base = Math.floor(target / safe.length)
    const result = safe.map(() => base)
    for (let index = 0; index < target - base * safe.length; index += 1) result[index] += 1
    return result
  }

  const raw = safe.map((value) => (value / total) * target)
  const result = raw.map((value) => Math.floor(value))
  let remainder = target - result.reduce((sum, value) => sum + value, 0)

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)

  for (let offset = 0; remainder > 0; offset += 1, remainder -= 1) {
    result[order[offset % order.length].index] += 1
  }

  return result
}

/** Làm tròn half-up từng phần tử (dùng khi bản nháp chưa đủ tổng mục tiêu). */
export function roundIntegers(values: number[]): number[] {
  return values.map((value) => (Number.isFinite(value) ? Math.round(value) : 0))
}
