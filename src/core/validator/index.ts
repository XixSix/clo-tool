/**
 * Tổng hợp bộ validator.
 *
 * Validator Config nằm trong `./config` (mỗi sheet một file + crossSheet).
 * Validator điểm thô nằm trong `./rawGrades`.
 * Helper dùng chung (bội 0,25, tổng điểm đề) nằm ở `./helpers`.
 */

export * from './helpers'
export { validateConfig } from './config'
export { validateRawGrades } from './rawGrades'
