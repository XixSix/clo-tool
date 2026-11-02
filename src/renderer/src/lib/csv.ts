/** Tải file CSV (UTF-8 BOM, phân tách bằng dấu ; để mở đúng trong Excel vi-VN) */
export function downloadCsv(
  fileName: string,
  rows: (string | number | null | undefined)[][]
): void {
  const escape = (value: string | number | null | undefined): string => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const content = '\uFEFF' + rows.map((row) => row.map(escape).join(';')).join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
