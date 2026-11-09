/**
 * Validate toàn vẹn liên kết giữa các khối của model Course (khối `integrity`):
 * kế hoạch đánh giá ↔ câu hỏi ↔ CLO ↔ ma trận PLO.
 */

import type { Course, ValidationIssue } from '../../types'
import { EPSILON, examMaxScoresOf } from '../helpers'
import { roundHalfUp } from '../../rules'
import { allQuestions } from '../../utils/courseModel'

export function validateIntegrity(course: Course): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const cloById = new Map(course.cloList.map((c) => [c.id, c]))
  const cloCodes = new Set(course.cloList.map((c) => c.maClo.trim()))
  const questions = allQuestions(course)

  const checkClo = (cloId: string, targetId?: string): void => {
    if (cloId && !cloById.has(cloId)) {
      issues.push({
        level: 'error',
        scope: 'integrity',
        targetId,
        message: `CLO "${cloId}" không có trong danh mục CLO.`
      })
    }
  }

  course.dotDanhGia.forEach((dot) =>
    dot.cloList.forEach((mapping) => checkClo(mapping.cloId, dot.id))
  )
  questions.forEach((q) => checkClo(q.cauHoi.cloId, q.cauHoi.id))
  course.piList.forEach((pi) => pi.cloIds.forEach((cloId) => checkClo(cloId, pi.maPi)))

  // 2. Cặp (đợt, CLO) phải khớp 2 chiều giữa kế hoạch và câu hỏi
  const planKeys = new Set(
    course.dotDanhGia.flatMap((dot) => dot.cloList.map((m) => `${dot.id}|${m.cloId}`))
  )
  const questionKeys = new Set(
    questions
      .filter((q) => q.dot.cachNhapDiem === 'QUESTION_SCORE')
      .map((q) => `${q.dot.id}|${q.cauHoi.cloId}`)
  )

  for (const key of questionKeys) {
    if (!planKeys.has(key)) {
      const [dotId, cloId] = key.split('|')
      issues.push({
        level: 'warning',
        scope: 'integrity',
        targetId: `${dotId}/${cloId}`,
        message: `Cặp đợt "${dotId}" – CLO "${cloId}" có câu hỏi nhưng không có trong kế hoạch đánh giá.`
      })
    }
  }
  for (const key of planKeys) {
    const [dotId, cloId] = key.split('|')
    const dot = course.dotDanhGia.find((d) => d.id === dotId)
    if (dot?.cachNhapDiem !== 'QUESTION_SCORE') continue
    if (!questionKeys.has(key)) {
      issues.push({
        level: 'warning',
        scope: 'integrity',
        targetId: `${dotId}/${cloId}`,
        message: `Cặp đợt "${dotId}" – CLO "${cloId}" có trong kế hoạch nhưng không có câu hỏi tương ứng.`
      })
    }
  }

  // Cảnh báo lệch tỷ lệ giữa điểm câu hỏi thực tế trong đề và tỷ lệ phân bổ kế hoạch
  for (const dot of course.dotDanhGia) {
    if (dot.cachNhapDiem !== 'QUESTION_SCORE') continue
    for (const de of dot.maDeList) {
      const qScores = new Map<string, number>()
      let totalMax = 0
      for (const q of de.cauHoi) {
        if (q.cloId && q.diemToiDa > 0) {
          qScores.set(q.cloId, (qScores.get(q.cloId) ?? 0) + q.diemToiDa)
          totalMax += q.diemToiDa
        }
      }
      if (totalMax > 0) {
        for (const mapping of dot.cloList) {
          const score = qScores.get(mapping.cloId) ?? 0
          const qRatio = (score / totalMax) * 100
          if (Math.abs(qRatio - mapping.tyLePhanBo) > 1.0) {
            issues.push({
              level: 'warning',
              scope: 'integrity',
              targetId: `${dot.id}/${de.maDe}/${mapping.cloId}`,
              message: `Tỷ lệ điểm câu hỏi CLO "${mapping.cloId}" trong đề ${dot.id}/${de.maDe} (${roundHalfUp(
                qRatio,
                1
              )}%) lệch so với kế hoạch (${roundHalfUp(mapping.tyLePhanBo, 1)}%).`
            })
          }
        }
      }
    }
  }

  // 3. CLO không được đợt nào đo
  const measuredClo = new Set(course.dotDanhGia.flatMap((dot) => dot.cloList.map((m) => m.cloId)))
  for (const clo of course.cloList) {
    if (clo.id && !measuredClo.has(clo.id)) {
      issues.push({
        level: 'error',
        scope: 'integrity',
        targetId: clo.maClo,
        message: `CLO "${clo.maClo}" không được đợt đánh giá nào đo.`
      })
    }
  }

  // 4. CLO chưa được ánh xạ tới PI/PLO
  const mappedClo = new Set(course.piList.flatMap((pi) => pi.cloIds))
  for (const clo of course.cloList) {
    if (clo.id && !mappedClo.has(clo.id)) {
      issues.push({
        level: 'warning',
        scope: 'integrity',
        targetId: clo.maClo,
        message: `CLO "${clo.maClo}" chưa được ánh xạ tới PI/PLO nào.`
      })
    }
  }

  // 5. Tổng điểm tối đa mỗi đề phải bằng 10
  for (const [key, total] of Object.entries(examMaxScoresOf(course))) {
    if (Math.abs(total - 10) > EPSILON) {
      const [dotId, maDe] = key.split('|')
      issues.push({
        level: 'error',
        scope: 'integrity',
        targetId: `${dotId}/${maDe}`,
        message: `Tổng điểm tối đa của đề ${dotId}/${maDe} = ${roundHalfUp(
          total,
          2
        )}, phải bằng 10.`
      })
    }
  }

  // 6. Mã CLO hiển thị phải khớp giữa id và mã (phục vụ báo cáo)
  for (const clo of course.cloList) {
    if (clo.maClo.trim() && !cloCodes.has(clo.maClo.trim())) {
      issues.push({
        level: 'warning',
        scope: 'integrity',
        targetId: clo.maClo,
        message: `CLO "${clo.maClo}" có mã không nhất quán.`
      })
    }
  }

  return issues
}
