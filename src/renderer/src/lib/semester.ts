/** Các lựa chọn nhanh cho ô "Học kỳ" khi thêm môn. */
export type SemesterOption = 'Học kì 1' | 'Học kì 2' | 'Khác' | ''

/** Nhận diện giá trị học kỳ (người dùng nhập hoặc đọc từ Config) về lựa chọn nhanh. */
export function semesterOptionOf(value: string): SemesterOption {
  if (!value) return ''
  const norm = value.toLowerCase()
  if (
    value === 'Học kì 1' ||
    value === 'HK1' ||
    value === '1' ||
    norm === 'kỳ 1' ||
    norm === 'kì 1' ||
    norm === 'học kỳ 1'
  ) {
    return 'Học kì 1'
  }
  if (
    value === 'Học kì 2' ||
    value === 'HK2' ||
    value === '2' ||
    norm === 'kỳ 2' ||
    norm === 'kì 2' ||
    norm === 'học kỳ 2'
  ) {
    return 'Học kì 2'
  }
  return 'Khác'
}
