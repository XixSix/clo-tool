/**
 * Tiện ích Excel dùng chung cho cả parse Config lẫn file điểm thô.
 *
 * - `cellValue`: đọc/ghi giá trị ô (text an toàn, số, boolean, ngày)
 * - `workbook`: mở/ghi workbook, dò sheet, dò hàng tiêu đề
 * - `headerMatcher`: chuẩn hoá & ghép tên cột, gợi ý tên gần giống khi lệch
 */

export * from './cellValue'
export * from './headerMatcher'
export * from './workbook'
