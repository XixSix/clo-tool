/**
 * Chuẩn hoá & dò tên cột trong file Excel.
 *
 * Mục tiêu: giảng viên có thể đổi tên cột (thêm dấu, khoảng trắng, chữ hoa/thường,
 * dùng "_" thay khoảng trắng...) mà app vẫn đọc đúng. Khi lệch nhiều, trả về gợi ý
 * tên gần nhất để hiển thị trên màn hình lỗi.
 */

import { normalizeHeader } from '../normalizeVi'

export { normalizeHeader }

/** Khoảng cách Levenshtein dùng để gợi ý tên cột gần giống */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = curr
  }
  return prev[b.length]
}

/** Tên gọi khác thường gặp của các cột chuẩn (đã chuẩn hoá) */
const HEADER_ALIASES: Record<string, string[]> = {
  masv: ['masinhvien', 'mssv', 'masosinhvien', 'masohoso', 'mahoso'],
  hoten: ['hovaten', 'hovaten'],
  hovaten: ['hoten'],
  ngaysinh: ['ngaysinh'],
  tt: ['stt', 'so'],
  made: ['made', 'made'],
  ghichu: ['ghichu'],
  hinhthucthi: ['hinhthuc', 'hinhthucthi', 'hinhthucdanhgia'],
  trongsoclo: ['trongsoclo', 'trongso'],
  nhom: ['nhom', 'nhomdanhgia'],
  trongsophantram: ['trongsophantram', 'trongso', 'trongsopt', 'phantram'],
  diemtoida: ['diemtoida', 'diemmax', 'maxscore', 'toida'],
  macotdiem: ['macotdiem', 'macot', 'cotdiem'],
  madaudiem: ['madaudiem', 'daudiem'],
  bacnangluc: ['bacnangluc', 'nangluc'],
  sotinchi: ['sotinchi', 'tinchi', 'stc'],
  loaihp: ['loaihp', 'loaihocphan'],
  tenhp: ['tenhp', 'tenhocphan'],
  mahp: ['mahp', 'mahocphan'],
  maquytac: ['maquytac', 'quytac'],
  giatri: ['giatri'],
  mota: ['mota', 'diengiai']
}

function candidatesFor(normalized: string): string[] {
  return [normalized, ...(HEADER_ALIASES[normalized] ?? [])]
}

export interface HeaderMatchResult {
  /** Tên cột chuẩn -> chỉ số cột (0-based) trong file */
  mapping: Record<string, number>
  missing: string[]
  /** Cột có trong file nhưng không khai báo */
  extraColumns: { index: number; header: string }[]
  /** Tên cột thiếu -> tên gần giống trong file */
  suggestions: Record<string, string>
}

/**
 * Ghép danh sách cột chuẩn với tiêu đề thực tế của file.
 * Thứ tự ưu tiên: trùng khít sau chuẩn hoá -> chứa nhau -> gần giống (Levenshtein <= 3).
 */
export function matchHeaders(
  actualHeaders: (string | undefined)[],
  expectedColumns: string[]
): HeaderMatchResult {
  const normalizedActual = actualHeaders.map((h) => normalizeHeader(h ?? ''))
  const mapping: Record<string, number> = {}
  const suggestions: Record<string, string> = {}
  const used = new Set<number>()

  // Lượt 1: trùng khít
  for (const expected of expectedColumns) {
    const candidates = candidatesFor(normalizeHeader(expected))
    const idx = normalizedActual.findIndex((h, i) => !used.has(i) && candidates.includes(h))
    if (idx >= 0) {
      mapping[expected] = idx
      used.add(idx)
    }
  }

  // Lượt 2: chứa nhau (ví dụ "Họ và tên" vs "Họ tên")
  for (const expected of expectedColumns) {
    if (mapping[expected] !== undefined) continue
    const candidates = candidatesFor(normalizeHeader(expected))
    const idx = normalizedActual.findIndex(
      (h, i) =>
        !used.has(i) && h.length > 0 && candidates.some((c) => h.includes(c) || c.includes(h))
    )
    if (idx >= 0) {
      mapping[expected] = idx
      used.add(idx)
    }
  }

  // Lượt 3: gần giống
  const missing: string[] = []
  for (const expected of expectedColumns) {
    if (mapping[expected] !== undefined) continue
    const candidates = candidatesFor(normalizeHeader(expected))
    let bestIdx = -1
    let bestDistance = Number.POSITIVE_INFINITY
    normalizedActual.forEach((h, i) => {
      if (used.has(i) || !h) return
      for (const candidate of candidates) {
        const distance = levenshtein(candidate, h)
        if (distance < bestDistance) {
          bestDistance = distance
          bestIdx = i
        }
      }
    })
    if (bestIdx >= 0 && bestDistance <= Math.max(2, Math.floor(candidates[0].length / 3))) {
      mapping[expected] = bestIdx
      suggestions[expected] = actualHeaders[bestIdx] ?? ''
      used.add(bestIdx)
    } else {
      missing.push(expected)
      if (bestIdx >= 0) suggestions[expected] = actualHeaders[bestIdx] ?? ''
    }
  }

  const extraColumns: { index: number; header: string }[] = []
  actualHeaders.forEach((h, i) => {
    if (!used.has(i) && (h ?? '').trim() !== '') {
      extraColumns.push({ index: i, header: h ?? '' })
    }
  })

  return { mapping, missing, extraColumns, suggestions }
}
