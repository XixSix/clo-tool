/**
 * Nhóm IO: đọc/ghi Excel theo nghiệp vụ — Config học phần, điểm thô và template.
 *
 * Tiện ích Excel thuần (đọc ô, mở workbook, dò tiêu đề) nằm ở `../utils/excel`.
 *
 * - configParser: parse Template_Config.xlsx → CourseConfig
 * - rawGradesParser: parse Template_DiemTho.xlsx → RawGradesFile
 * - templateGenerator: sinh lại 2 file template mẫu
 */

export * from './configParser'
export * from './rawGradesParser'
export * from './templateGenerator'
