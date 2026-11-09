/**
 * Validate đề thi và câu hỏi (khối `exam`).
 *
 * Quy ước trong model:
 * - Đợt đánh giá (Đ) = `AssessmentComponent.id`
 * - Mã đề (M)       = `ExamVariant.maDe`
 * - Câu (C)         = `ExamQuestion.cau`
 * - CLO (L)         = `ExamQuestion.cloId`
 * - Cột điểm (X)    = `ExamQuestion.id` (mã cột trong file NHAP_LIEU)
 *
 * 4 quy tắc nhất quán:
 * - Q1: mỗi cột X chỉ có một Diem_Toi_Da (toàn học phần).
 * - Q2: mỗi cột X chỉ thuộc một đợt đánh giá Đ.
 * - Q3: trong một ô (Đ, L), mỗi cột X chỉ xuất hiện một lần.
 * - Q4: trong một đề (Đ, M), mỗi cặp (C, L) chỉ xuất hiện một lần.
 */

import type { Course, ValidationIssue } from '../../types'
import { isMultipleOfQuarter } from '../helpers'
import { roundHalfUp } from '../../rules'
import { allQuestions } from '../../utils/courseModel'

const VALID_LOAI = new Set(['TL', 'TN'])

export const validateExam = (course: Course): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const questions = allQuestions(course)

  const hasDirectScore = course.dotDanhGia.some((d) => d.cachNhapDiem === 'DIRECT_CLO_SCORE')
  const hasAttendance = course.dotDanhGia.some((d) => d.cachNhapDiem === 'ATTENDANCE')

  if (questions.length === 0 && !hasDirectScore && !hasAttendance) {
    issues.push({
      level: 'error',
      scope: 'exam',
      message: 'Chưa khai báo câu hỏi hoặc cột điểm nào.'
    })
  }

  const maxByColumn = new Map<string, number>()
  const dotByColumn = new Map<string, Set<string>>()
  const cellColumns = new Map<string, Set<string>>()
  const examQuestions = new Map<string, Set<string>>()
  const papersByColumn = new Map<string, Set<string>>()

  for (const { dot, de, cauHoi } of questions) {
    const hasCotDiem = !!cauHoi.id && cauHoi.id.trim() !== ''
    const hasDauDiem = !!dot.id && dot.id.trim() !== ''
    const hasCau = cauHoi.cau !== undefined && String(cauHoi.cau).trim() !== ''
    const hasClo = !!cauHoi.cloId && cauHoi.cloId.trim() !== ''
    const maDe = de.maDe && de.maDe.trim() !== '' ? de.maDe : 'ALL'

    if (!hasCotDiem) {
      issues.push({
        level: 'error',
        scope: 'exam',
        targetId: dot.id,
        message: 'Thiếu mã cột điểm câu hỏi.'
      })
    }

    if (!hasDauDiem) {
      issues.push({
        level: 'error',
        scope: 'exam',
        targetId: cauHoi.id,
        message: 'Thiếu mã đợt đánh giá.'
      })
    }

    if (!hasCau) {
      issues.push({
        level: 'warning',
        scope: 'exam',
        targetId: cauHoi.id,
        message: 'Thiếu tên câu hỏi.'
      })
    }

    if (!hasClo) {
      issues.push({
        level: 'error',
        scope: 'exam',
        targetId: cauHoi.id,
        message: 'Thiếu mã CLO.'
      })
    }

    if (!Number.isFinite(cauHoi.diemToiDa) || cauHoi.diemToiDa <= 0) {
      issues.push({
        level: 'error',
        scope: 'exam',
        targetId: cauHoi.id,
        message: `Điểm tối đa của câu "${cauHoi.id}" phải lớn hơn 0.`
      })
    }

    if (hasCotDiem) {
      if (maxByColumn.has(cauHoi.id) && maxByColumn.get(cauHoi.id) !== cauHoi.diemToiDa) {
        issues.push({
          level: 'error',
          scope: 'exam',
          targetId: cauHoi.id,
          message: `Cột điểm "${cauHoi.id}" được khai với điểm tối đa khác nhau (${maxByColumn.get(
            cauHoi.id
          )} và ${cauHoi.diemToiDa}).`
        })
      } else {
        maxByColumn.set(cauHoi.id, cauHoi.diemToiDa)
      }

      if (hasDauDiem) {
        const dots = dotByColumn.get(cauHoi.id) ?? new Set<string>()
        dots.add(dot.id)
        dotByColumn.set(cauHoi.id, dots)
      }

      if (hasDauDiem && hasClo) {
        const cellKey = `${dot.id}|${cauHoi.cloId}`
        const columns = cellColumns.get(cellKey) ?? new Set<string>()
        if (columns.has(cauHoi.id)) {
          issues.push({
            level: 'error',
            scope: 'exam',
            targetId: cauHoi.id,
            message: `Cột điểm "${cauHoi.id}" được dùng cho nhiều câu trong cùng ô (đợt "${dot.id}" – CLO "${cauHoi.cloId}") làm trùng lặp điểm.`
          })
        }
        columns.add(cauHoi.id)
        cellColumns.set(cellKey, columns)

        const paperKey = `${dot.id}|${maDe}|${cauHoi.cloId}`
        const papers = papersByColumn.get(cauHoi.id) ?? new Set<string>()
        papers.add(paperKey)
        papersByColumn.set(cauHoi.id, papers)
      }
    }

    if (hasDauDiem && hasCau && hasClo) {
      const examKey = `${dot.id}|${maDe}`
      const cauKey = `${String(cauHoi.cau)}|${cauHoi.cloId}`
      const list = examQuestions.get(examKey) ?? new Set<string>()
      if (list.has(cauKey)) {
        issues.push({
          level: 'error',
          scope: 'exam',
          targetId: cauHoi.id,
          message: `Câu "${cauHoi.cau}" bị trùng tên trong đề ${dot.id}/${maDe}.`
        })
      }
      list.add(cauKey)
      examQuestions.set(examKey, list)
    }

    if (cauHoi.diemToiDa > 0 && !isMultipleOfQuarter(cauHoi.diemToiDa)) {
      issues.push({
        level: 'warning',
        scope: 'exam',
        targetId: cauHoi.id,
        message: `Điểm tối đa ${cauHoi.diemToiDa} của câu "${cauHoi.id}" không phải bội của 0,25.`
      })
    }

    if (!de.maDe || de.maDe.trim() === '') {
      issues.push({
        level: 'warning',
        scope: 'exam',
        targetId: cauHoi.id,
        message: `Câu "${cauHoi.cau}" (cột "${cauHoi.id}") chưa khai mã đề — sẽ coi là áp dụng cho mọi đề (ALL).`
      })
    }

    if (cauHoi.loai !== undefined && !VALID_LOAI.has(cauHoi.loai)) {
      issues.push({
        level: 'warning',
        scope: 'exam',
        targetId: cauHoi.id,
        message: `Loại câu hỏi "${cauHoi.loai}" của câu "${cauHoi.id}" không thuộc TN/TL.`
      })
    }
  }

  for (const [maCotDiem, dots] of dotByColumn) {
    if (dots.size > 1) {
      issues.push({
        level: 'error',
        scope: 'exam',
        targetId: maCotDiem,
        message: `Cột điểm "${maCotDiem}" được dùng ở nhiều đợt đánh giá (${[...dots].join(', ')}).`
      })
    }
  }

  for (const [maCotDiem, papers] of papersByColumn) {
    const entries = [...papers].map((key) => {
      const [dauDiem, de, clo] = key.split('|')
      return { dauDiem, de, clo }
    })
    const dots = new Set(entries.map((e) => e.dauDiem))
    const des = new Set(entries.map((e) => e.de))
    const clos = new Set(entries.map((e) => e.clo))
    if (dots.size === 1 && des.size > 1 && clos.size > 1) {
      issues.push({
        level: 'warning',
        scope: 'exam',
        targetId: maCotDiem,
        message: `Cột điểm "${maCotDiem}" được dùng ở nhiều đề (${[...des].join(', ')}).`,
        suggestion: 'Kiểm tra lại nếu không cố ý dùng chung cột điểm giữa các đề.'
      })
    }
  }

  // Tổng điểm câu đo CLO tham gia PLO phải > 50% điểm bài thi (QĐ450 Điều 3.4)
  const ploClos = new Set(course.piList.flatMap((pi) => pi.cloIds))
  if (ploClos.size > 0) {
    const totals = new Map<string, { total: number; columns: Set<string> }>()
    for (const { dot, de, cauHoi } of questions) {
      const key = `${dot.id}|${de.maDe || 'ALL'}`
      const entry = totals.get(key) ?? { total: 0, columns: new Set<string>() }
      if (!entry.columns.has(cauHoi.id)) {
        entry.total += cauHoi.diemToiDa
        entry.columns.add(cauHoi.id)
        totals.set(key, entry)
      }
    }
    for (const [key, entry] of totals.entries()) {
      const [maDauDiem, maDe] = key.split('|')
      const unique = new Map(
        questions
          .filter((q) => q.dot.id === maDauDiem && (q.de.maDe || 'ALL') === maDe)
          .map((q) => [q.cauHoi.id, q.cauHoi])
      )
      const ploTotal = Array.from(unique.values())
        .filter((q) => ploClos.has(q.cloId))
        .reduce((sum, q) => sum + q.diemToiDa, 0)
      if (entry.total > 0 && ploTotal / entry.total <= 0.5) {
        issues.push({
          level: 'warning',
          scope: 'exam',
          targetId: `${maDauDiem}/${maDe}`,
          message: `Đề ${maDauDiem}/${maDe}: điểm các câu đo CLO tham gia đánh giá PLO chỉ chiếm ${roundHalfUp(
            (ploTotal / entry.total) * 100,
            1
          )}% (≤ 50%).`
        })
      }
    }
  }

  return issues
}
