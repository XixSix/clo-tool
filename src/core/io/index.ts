/**
 * Nhóm IO: đọc/ghi Excel theo nghiệp vụ — điểm thô và template nhập điểm.
 *
 * Cấu hình học phần KHÔNG còn đọc/ghi từ Excel: dữ liệu được nhập trực tiếp
 * trên ứng dụng dưới dạng model `Course`.
 *
 * Tiện ích Excel thuần (đọc ô, mở workbook, dò tiêu đề) nằm ở `../utils/excel`.
 *
 * - gradeSheetParser: parse Template_DiemTho.xlsx → GradeSheetData (kiểu dữ liệu thô)
 * - gradeSheetTemplateGenerator: sinh Template_DiemTho.xlsx
 */

export * from './gradeSheetParser'
export * from './templateGenerator'
