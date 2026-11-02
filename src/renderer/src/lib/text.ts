/** Bỏ dấu tiếng Việt + lowercase để so khớp tìm kiếm. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
