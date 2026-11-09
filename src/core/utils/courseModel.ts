/**
 * Truy vấn model `Course`: các phép "duỗi phẳng" cấu trúc phân cấp
 * (đợt đánh giá → mã đề → câu hỏi) để calculator, validator và exporter cùng dùng.
 *
 * Thuần TypeScript, không phụ thuộc Electron/React.
 */

import type {
  AssessmentComponent,
  AssessmentGroup,
  Course,
  ExamQuestion,
  ExamVariant
} from '../types'

/** Một câu hỏi kèm ngữ cảnh đợt đánh giá + mã đề chứa nó. */
export interface CourseQuestionRef {
  dot: AssessmentComponent
  de: ExamVariant
  cauHoi: ExamQuestion
}

/** Một ánh xạ CLO trong đợt đánh giá kèm ngữ cảnh. */
export interface CourseCloMappingRef {
  dot: AssessmentComponent
  mappingId: string
  cloId: string
  tyLePhanBo: number
}

/** Toàn bộ câu hỏi của học phần, duỗi theo thứ tự đợt → đề → câu. */
export function allQuestions(course: Course): CourseQuestionRef[] {
  const result: CourseQuestionRef[] = []
  for (const dot of course.dotDanhGia) {
    for (const de of dot.maDeList) {
      for (const cauHoi of de.cauHoi) {
        result.push({ dot, de, cauHoi })
      }
    }
  }
  return result
}

/** Các mã cột điểm cần có trong file điểm thô (mã cột = ExamQuestion.id hoặc mã đợt nhập trực tiếp). */
export function scoreColumns(course: Course): string[] {
  const result: string[] = []
  for (const dot of course.dotDanhGia) {
    if (dot.cachNhapDiem === 'QUESTION_SCORE') {
      for (const de of dot.maDeList) {
        for (const cauHoi of de.cauHoi) {
          if (!result.includes(cauHoi.id)) result.push(cauHoi.id)
        }
      }
    } else if (dot.cachNhapDiem === 'DIRECT_CLO_SCORE') {
      if (!result.includes(dot.id)) result.push(dot.id)
    }
  }
  return result
}

/** Điểm tối đa theo từng mã cột điểm (giữ giá trị đầu tiên gặp). */
export function maxScoreByColumn(course: Course): Map<string, number> {
  const map = new Map<string, number>()
  for (const dot of course.dotDanhGia) {
    if (dot.cachNhapDiem === 'QUESTION_SCORE') {
      for (const de of dot.maDeList) {
        for (const cauHoi of de.cauHoi) {
          if (!map.has(cauHoi.id)) map.set(cauHoi.id, cauHoi.diemToiDa)
        }
      }
    } else if (dot.cachNhapDiem === 'DIRECT_CLO_SCORE') {
      if (!map.has(dot.id)) map.set(dot.id, 10)
    }
  }
  return map
}

/**
 * Tổng điểm tối đa của từng đề, khóa `đợtId|maDe`.
 * Một cột điểm có thể phục vụ nhiều CLO nên chỉ cộng một lần theo `ExamQuestion.id`.
 */
export function examMaxScores(course: Course): Record<string, number> {
  const result: Record<string, number> = {}
  for (const dot of course.dotDanhGia) {
    for (const de of dot.maDeList) {
      const columns = new Map<string, number>()
      for (const cauHoi of de.cauHoi) columns.set(cauHoi.id, cauHoi.diemToiDa)
      const total = Array.from(columns.values()).reduce((sum, v) => sum + v, 0)
      result[`${dot.id}|${de.maDe}`] = total
    }
  }
  return result
}

/** Trọng số toàn phần của từng CLO (% của điểm học phần). */
export function cloCourseWeights(course: Course): Record<string, number> {
  const weights: Record<string, number> = {}
  for (const dot of course.dotDanhGia) {
    for (const mapping of dot.cloList) {
      const w = (dot.trongSoPhanTram * mapping.tyLePhanBo) / 100
      weights[mapping.cloId] = (weights[mapping.cloId] ?? 0) + w
    }
  }
  return weights
}

/** Các đợt đánh giá thuộc một nhóm (CC / GK / CK). */
export function componentsByGroup(
  course: Course,
  groups: AssessmentGroup[]
): AssessmentComponent[] {
  return course.dotDanhGia.filter((dot) => groups.includes(dot.nhom))
}

/** Các CLO có mặt trong nhóm đánh giá, theo đúng thứ tự khai báo của học phần. */
export function cloIdsByGroup(course: Course, groups: AssessmentGroup[]): string[] {
  const found = new Set<string>()
  for (const dot of componentsByGroup(course, groups)) {
    for (const mapping of dot.cloList) found.add(mapping.cloId)
  }
  return course.cloList.filter((clo) => found.has(clo.id)).map((clo) => clo.id)
}

/** Toàn bộ ánh xạ CLO của học phần, duỗi theo đợt đánh giá. */
export function allCloMappings(course: Course): CourseCloMappingRef[] {
  const result: CourseCloMappingRef[] = []
  for (const dot of course.dotDanhGia) {
    for (const mapping of dot.cloList) {
      result.push({
        dot,
        mappingId: `${dot.id}_${mapping.cloId}`,
        cloId: mapping.cloId,
        tyLePhanBo: mapping.tyLePhanBo
      })
    }
  }
  return result
}
