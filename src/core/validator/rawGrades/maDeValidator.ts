/**
 * Validate cột "Mã đề" của điểm cuối kỳ.
 *
 * Chỉ có ý nghĩa khi học phần có nhiều đề thi CK: mỗi dòng có điểm CK phải khai
 * báo mã đề (giá trị `ALL` vẫn hợp lệ). Một đề duy nhất thì cột này là tùy chọn.
 */

import type { CourseConfig, RawGrades, ValidationIssue } from '../../types'
import { finalConfig, finalExamVariants } from '../../io/phaseConfig'
import { scoreColumnsFromConfig } from '../../utils/scoreColumns'

export function validateMaDe(
  config: CourseConfig,
  file: RawGrades,
  options: { requireMaDe?: boolean } = {}
): ValidationIssue[] {
  if (!options.requireMaDe) return []

  const ckColumns = scoreColumnsFromConfig(finalConfig(config))
  const ckGroups = new Set(
    config.keHoachDanhGia.filter((item) => item.nhom === 'CK').map((item) => item.maDauDiem)
  )
  const variants = finalExamVariants(config)
  const issues: ValidationIssue[] = []

  file.students.forEach((row, index) => {
    const hasCkScore = ckColumns.some((maCot) => row.scores.diemCacCot[maCot] !== undefined)
    // Mã đề CK có thể nằm ở bản đồ theo đầu điểm sau khi ghép 2 giai đoạn
    const groupMaDe = [...ckGroups]
      .map((maDauDiem) => row.scores.maDeTheoDauDiem?.[maDauDiem])
      .find((value) => Boolean(value))
    const maDe = (groupMaDe ?? row.scores.maDe)?.trim()

    if (hasCkScore && !maDe) {
      issues.push({
        level: 'error',
        row: file.studentExcelRows?.[index] ?? row.student.tt,
        column: 'Ma_De',
        message: `SV ${row.student.maSv}: thiếu mã đề cuối kỳ (học phần có nhiều đề thi).`,
        suggestion: 'Nhập mã đề của đề SV đã làm, hoặc "ALL" nếu SV làm mọi đề.'
      })
      return
    }

    if (maDe && maDe.toUpperCase() !== 'ALL' && variants.length > 0 && !variants.includes(maDe)) {
      issues.push({
        level: 'warning',
        row: file.studentExcelRows?.[index] ?? row.student.tt,
        column: 'Ma_De',
        message: `SV ${row.student.maSv}: mã đề "${maDe}" không có trong danh sách đề CK của Config (${variants.join(', ')}).`
      })
    }
  })

  return issues
}
