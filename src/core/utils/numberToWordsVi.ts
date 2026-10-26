/**
 * Chuyển đổi điểm số sang chữ tiếng Việt theo chuẩn học vụ Đại học Việt Nam
 *
 * Quy chuẩn đã thống nhất:
 * Giữ chữ 'phẩy không' khi điểm tròn (ví dụ 6.0 -> 'Sáu phẩy không', 10.0 -> 'Mười phẩy không', 6.7 -> 'Sáu phẩy bảy')
 * để tránh việc ghi thêm hoặc sửa số trên bảng điểm giấy.
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

/**
 * Đọc số nguyên nhỏ từ 0 đến 10
 */
function readInteger(n: number): string {
  if (n === 10) return 'mười'
  if (n >= 0 && n <= 9) return DIGITS[n]
  return String(n)
}

/**
 * Đọc phần thập phân sau dấu phẩy
 * Ví dụ:
 * - 0 -> "không"
 * - 6 -> "sáu"
 * - 25 -> "hai lăm"
 */
function readDecimalPart(partStr: string): string {
  if (partStr.length === 1) {
    const d = parseInt(partStr, 10)
    return DIGITS[d]
  }

  if (partStr.length === 2) {
    const tens = parseInt(partStr[0], 10)
    const units = parseInt(partStr[1], 10)

    if (tens === 0) {
      return `không ${DIGITS[units]}`
    }
    if (tens === 1) {
      if (units === 0) return 'mười'
      if (units === 5) return 'mười lăm'
      return `mười ${DIGITS[units]}`
    }
    // tens >= 2
    let unitWord = DIGITS[units]
    if (units === 1) unitWord = 'mốt'
    else if (units === 4) unitWord = 'tư'
    else if (units === 5) unitWord = 'lăm'

    if (units === 0) {
      return `${DIGITS[tens]} mươi`
    }
    return `${DIGITS[tens]} mươi ${unitWord}`
  }

  // Nếu nhiều hơn 2 chữ số, đọc từng chữ số
  return partStr
    .split('')
    .map((ch) => DIGITS[parseInt(ch, 10)] ?? ch)
    .join(' ')
}

/**
 * Hàm chính đọc điểm số thành chữ tiếng Việt
 * @param score Điểm số (ví dụ: 6.6, 6.7, 10, 6.0)
 * @param decimals Số chữ số thập phân định dạng (mặc định 1 chữ số)
 * @param keepZeroDecimal Giữ chữ "phẩy không" khi điểm tròn (mặc định true)
 */
export function numberToWordsVi(score: number, decimals = 1, keepZeroDecimal = true): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return ''
  }

  // Định dạng số thành chuỗi với đúng số chữ số thập phân
  const fixedStr = score.toFixed(decimals)
  const [intPartStr, decPartStr] = fixedStr.split('.')

  const intVal = parseInt(intPartStr, 10)
  const intWords = readInteger(intVal)

  if (!decPartStr || (parseInt(decPartStr, 10) === 0 && !keepZeroDecimal)) {
    // Không đọc phần thập phân
    return capitalizeFirst(intWords)
  }

  const decWords = readDecimalPart(decPartStr)
  const result = `${intWords} phẩy ${decWords}`
  return capitalizeFirst(result)
}

function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
