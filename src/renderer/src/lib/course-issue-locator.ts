/**
 * Ánh xạ `ValidationIssue` của core về đúng vị trí UI trong editor cấu hình môn.
 * Thuần TS (không React) để test được ngoài renderer.
 */

import type { ValidationIssue } from '@core/types/validation'
import type {
  CourseDetailTab,
  EditorConfig
} from '../components/screens/courses/course-editor-types'

export interface TabIssueStats {
  errors: number
  warnings: number
}

export interface LocatedIssues {
  courseField: Record<string, ValidationIssue[]>
  clo: Record<string, ValidationIssue[]>
  dot: Record<string, ValidationIssue[]>
  question: Record<string, ValidationIssue[]>
  ploCode: Record<string, ValidationIssue[]>
  piCode: Record<string, ValidationIssue[]>
  cloGlobal: ValidationIssue[]
  planGlobal: ValidationIssue[]
  ploGlobal: ValidationIssue[]
  global: ValidationIssue[]
  tabStats: Record<CourseDetailTab, TabIssueStats>
  tabOfIssue: Map<ValidationIssue, CourseDetailTab>
}

const COURSE_FIELDS = new Set(['maHp', 'tenHp', 'soTinChi', 'hinhThucThi', 'loaiHp'])

function emptyTabStats(): Record<CourseDetailTab, TabIssueStats> {
  return {
    'info-clo': { errors: 0, warnings: 0 },
    'plan-exam': { errors: 0, warnings: 0 },
    plo: { errors: 0, warnings: 0 }
  }
}

export function emptyLocatedIssues(): LocatedIssues {
  return {
    courseField: {},
    clo: {},
    dot: {},
    question: {},
    ploCode: {},
    piCode: {},
    cloGlobal: [],
    planGlobal: [],
    ploGlobal: [],
    global: [],
    tabStats: emptyTabStats(),
    tabOfIssue: new Map()
  }
}

function pushIssue(
  bucket: Record<string, ValidationIssue[]>,
  key: string,
  issue: ValidationIssue
): void {
  const list = bucket[key]
  if (list) list.push(issue)
  else bucket[key] = [issue]
}

export function locateIssues(issues: ValidationIssue[], editor: EditorConfig): LocatedIssues {
  const located = emptyLocatedIssues()

  const cloCodes = new Set(editor.cloList.map((clo) => clo.maClo.trim()).filter(Boolean))
  const dotCodes = new Set(
    editor.keHoachDanhGia.map((row) => row.maDauDiem.trim()).filter(Boolean)
  )
  const questionCodes = new Set(editor.cauHoi.map((row) => row.maCotDiem.trim()).filter(Boolean))
  const ploCodes = new Set(editor.maTranPlo.map((row) => row.plo.trim()).filter(Boolean))
  const piCodes = new Set(editor.maTranPlo.map((row) => row.pi.trim()).filter(Boolean))

  const tabOf = (issue: ValidationIssue): CourseDetailTab => {
    switch (issue.scope) {
      case 'course_info':
      case 'clo':
        return 'info-clo'
      case 'assessment':
      case 'exam':
        return 'plan-exam'
      case 'plo':
        return 'plo'
      case 'integrity': {
        const target = issue.targetId?.trim() ?? ''
        if (!target) return 'info-clo'
        if (target.includes('/')) return 'plan-exam'
        if (piCodes.has(target) || ploCodes.has(target) || /^PLO\d+\./.test(target)) return 'plo'
        if (questionCodes.has(target) || dotCodes.has(target)) return 'plan-exam'
        return 'info-clo'
      }
      default:
        return 'info-clo'
    }
  }

  for (const issue of issues) {
    const target = issue.targetId?.trim() ?? ''

    switch (issue.scope) {
      case 'course_info':
        pushIssue(located.courseField, COURSE_FIELDS.has(target) ? target : '__global__', issue)
        break

      case 'clo':
        if (!target) located.cloGlobal.push(issue)
        else if (target === 'maClo') pushIssue(located.clo, '__empty__', issue)
        else pushIssue(located.clo, target, issue)
        break

      case 'assessment':
        // targetId có thể là mã đợt, mã CLO (cảnh báo chuyên cần đơn lẻ) hoặc "id".
        if (target && dotCodes.has(target)) pushIssue(located.dot, target, issue)
        else located.planGlobal.push(issue)
        break

      case 'exam':
        if (!target) located.planGlobal.push(issue)
        else if (questionCodes.has(target)) pushIssue(located.question, target, issue)
        else if (target.includes('/')) pushIssue(located.dot, target.split('/')[0], issue)
        else if (dotCodes.has(target)) pushIssue(located.dot, target, issue)
        else pushIssue(located.question, target, issue)
        break

      case 'plo': {
        if (!target || target === 'maPlo' || target === 'maPi') {
          located.ploGlobal.push(issue)
          break
        }
        if (piCodes.has(target)) {
          pushIssue(located.piCode, target, issue)
          break
        }
        if (ploCodes.has(target)) {
          pushIssue(located.ploCode, target, issue)
          break
        }
        const base = /^(PLO\d+)\./.exec(target)?.[1]
        pushIssue(located.ploCode, base ?? target, issue)
        break
      }

      case 'integrity':
        if (!target) located.global.push(issue)
        else if (target.includes('/')) pushIssue(located.dot, target.split('/')[0], issue)
        else if (questionCodes.has(target)) pushIssue(located.question, target, issue)
        else if (dotCodes.has(target)) pushIssue(located.dot, target, issue)
        else if (piCodes.has(target)) pushIssue(located.piCode, target, issue)
        else if (cloCodes.has(target)) pushIssue(located.clo, target, issue)
        else if (ploCodes.has(target)) pushIssue(located.ploCode, target, issue)
        else located.global.push(issue)
        break

      default:
        located.global.push(issue)
        break
    }

    const tab = tabOf(issue)
    located.tabOfIssue.set(issue, tab)
    const stats = located.tabStats[tab]
    if (issue.level === 'error') stats.errors += 1
    else stats.warnings += 1
  }

  return located
}

/**
 * Các lỗi chỉ editor mới thấy được vì adapter bỏ dữ liệu khi chuyển sang `Course`
 * (dòng CLO trống mã, dòng kế hoạch chưa chọn CLO, dòng ma trận thiếu cặp PLO/PI,
 * trọng số thập phân mà core yêu cầu nguyên).
 */
export function collectEditorIssues(editor: EditorConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const clo of editor.cloList) {
    if (!clo.maClo.trim() && (clo.noiDung.trim() || clo.bacNangLuc.trim())) {
      issues.push({
        level: 'error',
        scope: 'clo',
        targetId: 'maClo',
        message:
          'Mã CLO không được để trống — dòng có nội dung nhưng thiếu mã sẽ bị bỏ khi lưu.'
      })
    }
  }

  for (const row of editor.keHoachDanhGia) {
    if (row.clo === '__PLACEHOLDER__') continue
    if (!row.clo.trim()) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: row.maDauDiem,
        message: `Đợt "${row.maDauDiem}" có dòng chưa chọn CLO — dòng này sẽ bị bỏ khi lưu.`
      })
    }
    if (
      Number.isFinite(row.trongSoPhanTram) &&
      row.trongSoPhanTram > 0 &&
      !Number.isInteger(row.trongSoPhanTram)
    ) {
      issues.push({
        level: 'error',
        scope: 'assessment',
        targetId: row.maDauDiem,
        message: `Trọng số ${row.trongSoPhanTram}% của đợt "${row.maDauDiem}" phải là số nguyên.`
      })
    }
  }

  for (const row of editor.maTranPlo) {
    const plo = row.plo.trim()
    const pi = row.pi.trim()
    if ((plo && !pi) || (!plo && pi)) {
      issues.push({
        level: 'warning',
        scope: 'plo',
        targetId: plo || 'maPlo',
        message: 'Dòng ma trận thiếu PLO hoặc PI sẽ bị bỏ khi lưu.'
      })
    }
  }

  return issues
}

export function dedupeIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const seen = new Set<string>()
  const result: ValidationIssue[] = []
  for (const issue of issues) {
    const key = `${issue.level}|${issue.scope}|${issue.targetId ?? ''}|${issue.message}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(issue)
  }
  return result
}
