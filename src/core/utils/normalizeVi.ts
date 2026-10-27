/** Bỏ dấu tiếng Việt, lowercase, bỏ mọi ký tự không phải chữ/số */
export function normalizeHeader(raw: string): string {
  if (!raw) return ''
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}
