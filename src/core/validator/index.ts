/**
 * Tổng hợp bộ validator.
 *
 * Validator học phần nằm trong `./course` (mỗi khối một file + integrityValidator).
 * Validator điểm thô nằm trong `./rawGrades`.
 * Helper dùng chung (bội 0,25, tổng điểm đề) nằm ở `./helpers`.
 */

export * from './helpers'
export { validateCourse } from './course'
export { validateRawGrades } from './rawGrades'
