/**
 * Tổng hợp bộ validator.
 *
 * Validator học phần nằm trong `./course` (mỗi khối một file + integrityValidator).
 * Validator bảng điểm nằm trong `./gradeSheet`.
 * Helper dùng chung (bội 0,25, tổng điểm đề) nằm ở `./helpers`.
 */

export * from './helpers'
export { validateCourse } from './course'
export { validateGradeSheet } from './gradeSheet'
