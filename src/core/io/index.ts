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
 * - phaseConfig: lọc Course theo giai đoạn nhập điểm (quá trình / cuối kỳ)
 * - configSignature: dấu vân tay Config để phát hiện thay đổi giữa 2 giai đoạn
 * - mergeGradeSheet: ghép file quá trình + file cuối kỳ theo Mã SV
 */

export * from './gradeSheetParser'
export * from './templateGenerator'
export * from './phaseConfig'
export * from './configSignature'
export * from './mergeGradeSheet'
