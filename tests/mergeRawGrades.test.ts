import { describe, expect, it } from 'vitest'
import type { CourseConfig, RawGrades, RawStudentRow } from '@core/types'
import { finalConfig, mergeRawGrades, processConfig, validateRawGrades } from '@core/index'
import { scoreColumnsFromConfig } from '@core/utils/scoreColumns'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from './fixtures/mockClass'

function rawFromStudents(
  students: RawStudentRow[],
  overrides: Partial<RawGrades> = {}
): RawGrades {
  return {
    meta: {
      tenHocPhan: 'Kỹ thuật lập trình',
      maHp: 'KTLT101',
      lop: '1A11_CNTT14',
      hocKy: 'HK1',
      namHoc: '2026-2027'
    },
    students,
    attendance: [],
    attendanceSessions: [],
    declaredMaxScores: {},
    studentExcelRows: students.map((_, index) => index + 2),
    ...overrides
  }
}

function pickColumns(
  row: RawStudentRow,
  columns: string[],
  maDe: string | undefined
): RawStudentRow {
  return {
    student: { ...row.student },
    scores: {
      maDe,
      diemCacCot: Object.fromEntries(
        Object.entries(row.scores.diemCacCot).filter(([code]) => columns.includes(code))
      ),
      ghiChu: row.scores.ghiChu
    }
  }
}

/** Tách lớp mock thành file quá trình (CC/GK) và file cuối kỳ (CK). */
function splitClass(
  config: CourseConfig,
  count = 10
): { original: RawStudentRow[]; process: RawGrades; final: RawGrades } {
  const { students, attendance } = buildMockClass(count)
  const processColumns = scoreColumnsFromConfig(processConfig(config))
  const ckColumns = scoreColumnsFromConfig(finalConfig(config))

  const process = rawFromStudents(
    students.map((row) => pickColumns(row, processColumns, row.scores.maDe)),
    {
      attendance: Object.entries(attendance).map(([maSv, symbols]) => ({ maSv, symbols })),
      attendanceSessions: MOCK_SESSION_LABELS.map((label) => ({ column: label, label }))
    }
  )
  const final = rawFromStudents(students.map((row) => pickColumns(row, ckColumns, row.scores.maDe)))

  return { original: students, process, final }
}

describe('mergeRawGrades', () => {
  const config = buildMockConfig()

  it('ghép happy path: giữ quá trình, lấy CK + mã đề từ file cuối kỳ', () => {
    const { original, process, final } = splitClass(config)
    const merged = mergeRawGrades(process, final, config)

    expect(merged.issues.filter((issue) => issue.level === 'error')).toHaveLength(0)
    expect(merged.file.students).toHaveLength(original.length)
    expect(merged.file.meta).toEqual(process.meta)
    expect(merged.file.attendance).toEqual(process.attendance)
    expect(merged.file.attendanceSessions).toEqual(process.attendanceSessions)

    const ckColumns = scoreColumnsFromConfig(finalConfig(config))
    merged.file.students.forEach((row, index) => {
      const source = original[index]
      expect(row.student.maSv).toBe(source.student.maSv)
      expect(row.student.tt).toBe(index + 1)
      expect(row.scores.maDe).toBe(source.scores.maDe)
      expect(row.scores.diemCacCot.CC).toEqual(source.scores.diemCacCot.CC)
      for (const column of ckColumns) {
        expect(row.scores.diemCacCot[column]).toEqual(source.scores.diemCacCot[column])
      }
    })
  })

  it('mã đề file cuối kỳ chỉ áp cho đầu điểm CK, giữ mã đề chung quá trình', () => {
    const { process, final } = splitClass(config, 3)
    final.students.forEach((row) => {
      row.scores.maDe = 'D3'
    })

    const merged = mergeRawGrades(process, final, config)
    expect(merged.file.students[0].scores.maDe).toBe('ALL')
    expect(merged.file.students[0].scores.maDeTheoDauDiem).toEqual({ CK: 'D3' })
  })

  it('không báo thiếu mã đề sau khi ghép (mã đề nằm ở bản đồ đầu điểm)', () => {
    const { process, final } = splitClass(config, 3)
    final.students.forEach((row) => {
      row.scores.maDe = 'D3'
    })

    const merged = mergeRawGrades(process, final, config)
    const issues = validateRawGrades(config, merged.file, { phase: 'final', requireMaDe: true })
    expect(issues.some((issue) => issue.message.includes('thiếu mã đề'))).toBe(false)
  })

  it('báo lỗi khi file cuối kỳ trùng Mã SV', () => {
    const { process, final } = splitClass(config, 3)
    final.students.push({ ...final.students[0] })

    const merged = mergeRawGrades(process, final, config)
    expect(merged.issues.some((issue) => issue.level === 'error' && /trùng Mã SV/.test(issue.message))).toBe(true)
  })

  it('báo lỗi khi SV chỉ có trong file cuối kỳ', () => {
    const { process, final } = splitClass(config, 3)
    final.students.push({
      student: { tt: 99, maSv: 'SV_ONLY_FINAL', ho: 'Chỉ', ten: 'Cuối', hoTen: 'Chỉ Cuối' },
      scores: { diemCacCot: { CK_C1: 1 } }
    })

    const merged = mergeRawGrades(process, final, config)
    expect(
      merged.issues.some(
        (issue) => issue.level === 'error' && /chỉ có trong file cuối kỳ/.test(issue.message)
      )
    ).toBe(true)
  })

  it('SV thiếu ở file cuối kỳ: CK = null + cảnh báo', () => {
    const { process, final } = splitClass(config, 3)
    const removed = final.students.pop()!
    const merged = mergeRawGrades(process, final, config)

    const row = merged.file.students.find((item) => item.student.maSv === removed.student.maSv)!
    expect(row).toBeDefined()
    expect(row.scores.diemCacCot.CK_C1).toBeNull()
    expect(
      merged.issues.some(
        (issue) =>
          issue.level === 'warning' &&
          issue.message.includes(removed.student.maSv) &&
          /không có trong file cuối kỳ/.test(issue.message)
      )
    ).toBe(true)
  })

  it('lệch họ tên: cảnh báo và giữ danh tính quá trình', () => {
    const { process, final } = splitClass(config, 3)
    final.students[0].student.hoTen = 'Tên Khác Hoàn Toàn'

    const merged = mergeRawGrades(process, final, config)
    const row = merged.file.students[0]
    expect(row.student.hoTen).toBe(process.students[0].student.hoTen)
    expect(
      merged.issues.some((issue) => issue.level === 'warning' && /họ tên/.test(issue.message))
    ).toBe(true)
  })

  it('lệch lớp/học kỳ: cảnh báo và giữ meta quá trình', () => {
    const { process, final } = splitClass(config, 3)
    final.meta = { ...final.meta, lop: 'LOP-KHAC', hocKy: 'HK2' }

    const merged = mergeRawGrades(process, final, config)
    expect(merged.file.meta.lop).toBe(process.meta.lop)
    expect(merged.file.meta.hocKy).toBe(process.meta.hocKy)
    expect(merged.issues.filter((issue) => /khác file quá trình/.test(issue.message))).toHaveLength(2)
  })

  it('báo lỗi khi file quá trình có dòng thiếu Mã SV', () => {
    const { process, final } = splitClass(config, 3)
    process.students[1] = {
      ...process.students[1],
      student: { ...process.students[1].student, maSv: '__MISSING_5' }
    }

    const merged = mergeRawGrades(process, final, config)
    expect(
      merged.issues.some(
        (issue) => issue.level === 'error' && /thiếu Mã SV/.test(issue.message)
      )
    ).toBe(true)
  })

  it('không đánh lại điểm danh: attendance lấy nguyên từ file quá trình', () => {
    const { process, final } = splitClass(config, 3)
    const merged = mergeRawGrades(process, final, config)
    expect(merged.file.attendance).toBe(process.attendance)
    expect(merged.file.attendanceSessions).toBe(process.attendanceSessions)
  })
})
