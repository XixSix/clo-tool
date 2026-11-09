/**
 * Nhóm IO: đọc/ghi Excel theo nghiệp vụ — điểm thô và template nhập điểm.
 *
 * Cấu hình học phần KHÔNG còn đọc/ghi từ Excel: dữ liệu được nhập trực tiếp
 * trên ứng dụng dưới dạng model `Course`.
 *
 * Tiện ích Excel thuần (đọc ô, mở workbook, dò tiêu đề) nằm ở `../utils/excel`.
 *
 * - rawGradesParser: parse Template_DiemTho.xlsx → RawGrades (kiểu dữ liệu thô)
 * - rawGradesTemplateGenerator: sinh Template_DiemTho.xlsx
 */

export * from './rawGradesParser'
export * from './templateGenerator'
