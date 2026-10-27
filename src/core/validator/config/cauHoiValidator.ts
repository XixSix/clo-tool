/**
 * Validate sheet CAU_HOI — khai báo cột điểm / câu hỏi thi.
 *
 * Quy ước trong sheet:
 * - Đầu điểm (Đ) = Ma_Dau_Diem (CC, GK, CK...).
 * - Mã đề (M)    = Ma_De (ALL = áp dụng cho mọi đề).
 * - Câu (C)      = Cau (Câu 1, Câu 2...).
 * - CLO (L)      = CLO.
 * - Cột điểm (X) = Ma_Cot_Diem (cột điểm thô trong file NHAP_LIEU).
 *
 * Phạm vi kiểm tra:
 * - Đề = (Đ, M) — một bài kiểm tra cụ thể.
 * - Ô  = (Đ, L) — đơn vị dùng để tính điểm CLO.
 *
 * 4 quy tắc nhất quán:
 * - Q1: mỗi cột X chỉ có một Diem_Toi_Da (toàn sheet).
 * - Q2: mỗi cột X chỉ thuộc một đầu điểm Đ (toàn sheet).
 * - Q3: trong một ô (Đ, L), mỗi cột X chỉ xuất hiện một lần.
 * - Q4: trong một đề (Đ, M), mỗi cặp (C, L) chỉ xuất hiện một lần
 *   (cùng câu nhưng khác CLO được phép — đó là các ý a, b của cùng câu).
 */

import type { CourseConfig, ValidationIssue } from '../../types'
import { isMultipleOfQuarter } from '../helpers'
import { roundHalfUp } from '../../rules'

const VALID_LOAI = new Set(['TL', 'TN'])

export const validateCauHoi = (config: CourseConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const question = config.cauHoi

  // Validate all sheet
  if (question.length === 0) {
    issues.push({
      level: 'error',
      sheet: 'CAU_HOI',
      message: 'Chưa khai báo câu hỏi hoặc cột điểm nào.'
    })
  }

  // Gom dữ liệu trong MỘT lượt duyệt, sau đó kiểm tra trên từng Map:
  // - maxByColumn:      X -> điểm tối đa                    (Q1)
  // - dauDiemByColumn:  X -> tập đầu điểm Đ sử dụng cột X    (Q2)
  // - cellColumns:      "Đ|L" -> tập cột X trong ô           (Q3)
  // - examQuestions:    "Đ|M" -> tập "C|L" trong đề          (Q4)
  // - papersByColumn:   X -> tập "Đ|M|L" để phát hiện cột dùng chung giữa nhiều đề
  const maxByColumn = new Map<string, number>()
  const dauDiemByColumn = new Map<string, Set<string>>()
  const cellColumns = new Map<string, Set<string>>()
  const examQuestions = new Map<string, Set<string>>()
  const papersByColumn = new Map<string, Set<string>>()

  for (const q of question) {
    // Cờ dữ liệu khóa hợp lệ: tránh báo lỗi dây chuyền khi ô trống
    const hasCotDiem = !!q.maCotDiem && q.maCotDiem.trim() !== ''
    const hasDauDiem = !!q.maDauDiem && q.maDauDiem.trim() !== ''
    const hasCau = !!q.cau && q.cau.trim() !== ''
    const hasClo = !!q.clo && q.clo.trim() !== ''
    // Ma_De trống được hiểu là "áp dụng cho mọi đề" (ALL)
    const maDe = q.maDe && q.maDe.trim() !== '' ? q.maDe : 'ALL'

    // --- 0. Dữ liệu bắt buộc ---

    // Validate Ma_Cot_Diem
    if (!hasCotDiem) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: 'Ma_Cot_Diem',
        message: 'Thiếu Mã cột điểm.'
      })
    }

    // Validate Ma_Dau_Diem
    if (!hasDauDiem) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: 'Ma_Dau_Diem',
        message: 'Thiếu Mã đầu điểm.'
      })
    }

    // Validate Cau — chỉ cảnh báo vì không tham gia tính điểm, chỉ dùng gộp câu
    if (!hasCau) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: 'Cau',
        message: 'Thiếu tên câu hỏi.'
      })
    }

    // Validate CLO
    if (!hasClo) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: 'CLO',
        message: 'Thiếu mã CLO.'
      })
    }

    // --- 1. Điểm tối đa của cột ---

    // Validate Diem_Toi_Da
    if (!Number.isFinite(q.diemToiDa) || q.diemToiDa <= 0) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Điểm tối đa của cột "${q.maCotDiem}" phải lớn hơn 0.`
      })
    }

    if (hasCotDiem) {
      // --- Q1: cùng một cột điểm phải khai cùng điểm tối đa ---
      // Một cột thô chỉ có một mốc tối đa; lệch mốc thì không biết quy đổi điểm.
      if (maxByColumn.has(q.maCotDiem) && maxByColumn.get(q.maCotDiem) !== q.diemToiDa) {
        issues.push({
          level: 'error',
          sheet: 'CAU_HOI',
          column: q.maCotDiem,
          message: `Cột điểm "${q.maCotDiem}" được khai với điểm tối đa khác nhau (${maxByColumn.get(q.maCotDiem)} và ${q.diemToiDa}).`
        })
      } else {
        maxByColumn.set(q.maCotDiem, q.diemToiDa)
      }

      // --- Q2: gom các đầu điểm đang dùng cột này ---
      // Báo lỗi sau vòng lặp để mỗi cột chỉ phát ra một issue.
      if (hasDauDiem) {
        const dauDiems = dauDiemByColumn.get(q.maCotDiem) ?? new Set<string>()
        dauDiems.add(q.maDauDiem)
        dauDiemByColumn.set(q.maCotDiem, dauDiems)
      }

      if (hasDauDiem && hasClo) {
        // --- Q3: trong cùng ô (Đ, L), mỗi cột chỉ được dùng một lần ---
        // Dùng lặp cột trong cùng ô sẽ khiến điểm của cột bị cộng hai lần.
        const cellKey = `${q.maDauDiem}|${q.clo}`
        const columns = cellColumns.get(cellKey) ?? new Set<string>()
        if (columns.has(q.maCotDiem)) {
          issues.push({
            level: 'error',
            sheet: 'CAU_HOI',
            column: q.maCotDiem,
            message: `Cột điểm "${q.maCotDiem}" được dùng cho nhiều câu trong cùng ô (đầu điểm "${q.maDauDiem}" – CLO "${q.clo}") làm trùng lặp điểm.`
          })
        }
        columns.add(q.maCotDiem)
        cellColumns.set(cellKey, columns)

        // Ghi nhận cột đã xuất hiện ở đề nào để cảnh báo dùng chung cột
        const paperKey = `${q.maDauDiem}|${maDe}|${q.clo}`
        const papers = papersByColumn.get(q.maCotDiem) ?? new Set<string>()
        papers.add(paperKey)
        papersByColumn.set(q.maCotDiem, papers)
      }
    }

    // --- Q4: trong cùng đề (Đ, M), mỗi cặp (C, L) chỉ xuất hiện một lần ---
    // Cùng câu nhưng khác CLO là hợp lệ (các ý a, b của cùng một câu).
    if (hasDauDiem && hasCau && hasClo) {
      const examKey = `${q.maDauDiem}|${maDe}`
      const cauKey = `${q.cau}|${q.clo}`
      const cauList = examQuestions.get(examKey) ?? new Set<string>()
      if (cauList.has(cauKey)) {
        issues.push({
          level: 'error',
          sheet: 'CAU_HOI',
          column: q.maCotDiem,
          message: `Câu "${q.cau}" bị trùng tên trong đề ${q.maDauDiem}/${maDe}.`
        })
      }
      cauList.add(cauKey)
      examQuestions.set(examKey, cauList)
    }

    // --- Cảnh báo ---

    // Điểm tối đa câu phải là bội của 0,25
    if (q.diemToiDa > 0 && !isMultipleOfQuarter(q.diemToiDa)) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Điểm tối đa ${q.diemToiDa} của cột "${q.maCotDiem}" không phải bội của 0,25.`
      })
    }

    if (!q.maDe || q.maDe.trim() === '') {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Câu "${q.cau}" (cột "${q.maCotDiem}") chưa khai mã đề — sẽ coi là áp dụng cho mọi đề (ALL).`
      })
    }

    if (q.loai !== undefined && !VALID_LOAI.has(q.loai)) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: q.maCotDiem,
        message: `Loại câu hỏi "${q.loai}" của cột "${q.maCotDiem}" không thuộc TN/TL.`
      })
    }
  }

  // --- Q2: một cột điểm chỉ được thuộc một đầu điểm ---
  // Cùng một cột thô mà dùng cho 2 đầu điểm (vd GKT và CK) thì cùng một điểm
  // sẽ được tính cho cả hai nhóm điểm -> sai bản chất.
  for (const [maCotDiem, dauDiems] of dauDiemByColumn) {
    if (dauDiems.size > 1) {
      issues.push({
        level: 'error',
        sheet: 'CAU_HOI',
        column: 'Ma_Dau_Diem',
        message: `Cột điểm "${maCotDiem}" được dùng ở nhiều đầu điểm (${[...dauDiems].join(', ')}).`
      })
    }
  }

  // --- Cảnh báo dùng chung cột điểm giữa nhiều đề ---
  // Trường hợp cùng cột + cùng CLO ở nhiều đề đã bị Q3 báo lỗi (SV làm mọi đề
  // sẽ bị cộng đôi). Ở đây chỉ cảnh báo phần còn lại: cùng cột nhưng đo CLO
  // khác nhau ở các đề khác nhau — có thể cố ý, nhưng nên soát lại.
  for (const [maCotDiem, papers] of papersByColumn) {
    const entries = [...papers].map((key) => {
      const [dauDiem, de, clo] = key.split('|')
      return { dauDiem, de, clo }
    })
    const dauDiems = new Set(entries.map((e) => e.dauDiem))
    const des = new Set(entries.map((e) => e.de))
    const clos = new Set(entries.map((e) => e.clo))
    if (dauDiems.size === 1 && des.size > 1 && clos.size > 1) {
      issues.push({
        level: 'warning',
        sheet: 'CAU_HOI',
        column: 'Ma_Cot_Diem',
        message: `Cột điểm "${maCotDiem}" được dùng ở nhiều đề (${[...des].join(', ')}).`,
        suggestion: 'Kiểm tra lại nếu không cố ý dùng chung cột điểm giữa các đề.'
      })
    }
  }

  // Tổng điểm câu đo CLO tham gia PLO phải > 50% điểm bài thi (QĐ450 Điều 3.4)
  if (config.maTranPlo.length > 0) {
    const ploClos = new Set(config.maTranPlo.map((m) => m.clo))
    const totals = new Map<string, { total: number; columns: Set<string> }>()
    for (const q of config.cauHoi) {
      const key = `${q.maDauDiem}|${q.maDe ?? 'ALL'}`
      const entry = totals.get(key) ?? { total: 0, columns: new Set<string>() }
      // Một cột điểm có thể phục vụ nhiều CLO -> chỉ cộng một lần
      if (!entry.columns.has(q.maCotDiem)) {
        entry.total += q.diemToiDa
        entry.columns.add(q.maCotDiem)
        totals.set(key, entry)
      }
    }
    for (const [key, entry] of totals.entries()) {
      const [maDauDiem, maDe] = key.split('|')
      // Tính theo cột duy nhất để không cộng trùng
      const unique = new Map(
        config.cauHoi
          .filter((q) => q.maDauDiem === maDauDiem && (q.maDe ?? 'ALL') === maDe)
          .map((q) => [q.maCotDiem, q])
      )
      const ploTotal = Array.from(unique.values())
        .filter((q) => ploClos.has(q.clo))
        .reduce((sum, q) => sum + q.diemToiDa, 0)
      if (entry.total > 0 && ploTotal / entry.total <= 0.5) {
        issues.push({
          level: 'warning',
          sheet: 'CAU_HOI',
          message: `Đề ${maDauDiem}/${maDe}: điểm các câu đo CLO tham gia đánh giá PLO chỉ chiếm ${roundHalfUp((ploTotal / entry.total) * 100, 1)}% (≤ 50%).`
        })
      }
    }
  }

  return issues
}
