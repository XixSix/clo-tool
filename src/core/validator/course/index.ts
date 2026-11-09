/**
 * Tổng hợp validator cho model `Course` (đặc tả mục V).
 *
 * Phân biệt:
 * - Lỗi (error): không cho tính tiếp.
 * - Cảnh báo (warning): vẫn tính, ghi vào sheet CANH_BAO.
 *
 * Mỗi khối của model `Course` có một file validator riêng; các check chéo
 * nằm ở integrityValidator.
 */

import type { Course, ValidationIssue } from '../../types'
import { validateCourseInfo } from './courseInfoValidator'
import { validateCloList } from './cloValidator'
import { validateAssessment } from './assessmentValidator'
import { validateExam } from './examValidator'
import { validatePlo } from './ploValidator'
import { validateIntegrity } from './integrityValidator'

/** Kiểm tra toàn bộ một học phần, trả về danh sách lỗi/cảnh báo theo từng khối. */
export function validateCourse(course: Course): ValidationIssue[] {
  return [
    ...validateCourseInfo(course),
    ...validateCloList(course),
    ...validateAssessment(course),
    ...validateExam(course),
    ...validatePlo(course),
    ...validateIntegrity(course)
  ]
}
