/**
 * Ghép dữ liệu điểm quá trình với điểm cuối kỳ theo Mã SV.
 *
 * Kết quả là một `RawGrades` đầy đủ để chạy lại toàn bộ engine (CLO/PLO/điểm HP/
 * psychometrics) bằng Config gốc. Điểm danh và danh tính của giai đoạn quá trình
 * được giữ nguyên; chỉ các cột CK và mã đề được lấy từ file cuối kỳ.
 */

import type { CourseConfig, RawGrades, RawStudentRow, ValidationIssue } from '../types'
import { scoreColumnsFromConfig } from '../utils/scoreColumns'
import { finalConfig } from './phaseConfig'

export interface MergeRawGradesResult {
  file: RawGrades
  issues: ValidationIssue[]
}

export function mergeRawGrades(
  process: RawGrades,
  final: RawGrades,
  config: CourseConfig
): MergeRawGradesResult {
  const ckColumns = scoreColumnsFromConfig(finalConfig(config))
  const ckGroups = new Set(
    config.keHoachDanhGia.filter((item) => item.nhom === 'CK').map((item) => item.maDauDiem)
  )
  const issues: ValidationIssue[] = []

  const finalByKey = new Map<string, { row: RawStudentRow; excelRow?: number }>()
  final.students.forEach((row, index) => {
    const key = row.student.maSv.trim()
    const excelRow = final.studentExcelRows?.[index]

    if (!key || key.startsWith('__MISSING_')) {
      issues.push({
        level: 'error',
        row: excelRow,
        column: 'Ma_SV',
        message: 'File cuối kỳ có dòng thiếu Mã SV.'
      })
      return
    }
    if (finalByKey.has(key)) {
      issues.push({
        level: 'error',
        row: excelRow,
        column: 'Ma_SV',
        message: `File cuối kỳ trùng Mã SV ${key}.`
      })
      return
    }
    finalByKey.set(key, { row, excelRow })
  })

  const seenProcess = new Set<string>()
  const students: RawStudentRow[] = process.students.map((processRow, index) => {
    const key = processRow.student.maSv.trim()
    const processExcelRow = process.studentExcelRows?.[index]

    if (!key || key.startsWith('__MISSING_')) {
      issues.push({
        level: 'error',
        row: processExcelRow,
        column: 'Ma_SV',
        message: 'File quá trình có dòng thiếu Mã SV.'
      })
    } else if (seenProcess.has(key)) {
      issues.push({
        level: 'error',
        row: processExcelRow,
        column: 'Ma_SV',
        message: `File quá trình trùng Mã SV ${key}.`
      })
    }
    seenProcess.add(key)

    const finalMatch = finalByKey.get(key)
    let scores = processRow.scores

    if (!finalMatch) {
      const diemCacCot = { ...processRow.scores.diemCacCot }
      for (const maCot of ckColumns) diemCacCot[maCot] = null
      scores = { ...processRow.scores, diemCacCot }
      issues.push({
        level: 'warning',
        row: processExcelRow,
        column: 'Ma_SV',
        message: `SV ${key}: không có trong file cuối kỳ; các cột CK để trống và tính 0 điểm.`
      })
    } else {
      finalByKey.delete(key)
      const { row: finalRow, excelRow: finalExcelRow } = finalMatch
      const diemCacCot = { ...processRow.scores.diemCacCot }
      for (const maCot of ckColumns) {
        diemCacCot[maCot] = finalRow.scores.diemCacCot[maCot] ?? null
      }
      // Mã đề CK gắn theo từng đầu điểm để không lọc mất câu của CC/GK
      // (các đầu điểm này có thể dùng mã đề khác, ví dụ GKT/D1, GTX/D2).
      const finalMaDe = finalRow.scores.maDe?.trim()
      const maDeTheoDauDiem = { ...processRow.scores.maDeTheoDauDiem }
      if (finalMaDe) {
        for (const maDauDiem of ckGroups) maDeTheoDauDiem[maDauDiem] = finalMaDe
      }
      scores = {
        maDe: processRow.scores.maDe,
        ...(Object.keys(maDeTheoDauDiem).length > 0 ? { maDeTheoDauDiem } : {}),
        diemCacCot,
        ghiChu: processRow.scores.ghiChu ?? finalRow.scores.ghiChu
      }
      issues.push(...compareIdentity(processRow, finalRow, key, finalExcelRow))
    }

    return {
      student: { ...processRow.student, tt: index + 1 },
      scores
    }
  })

  for (const [key, match] of finalByKey) {
    issues.push({
      level: 'error',
      row: match.excelRow,
      column: 'Ma_SV',
      message: `SV ${key}: chỉ có trong file cuối kỳ, thiếu dữ liệu quá trình.`
    })
  }

  issues.push(...compareMeta(process.meta, final.meta))

  return {
    file: {
      meta: process.meta,
      students,
      attendance: process.attendance,
      attendanceSessions: process.attendanceSessions,
      declaredMaxScores: process.declaredMaxScores
    },
    issues
  }
}

function compareIdentity(
  processRow: RawStudentRow,
  finalRow: RawStudentRow,
  key: string,
  excelRow?: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const processName = normalizeText(processRow.student.hoTen)
  const finalName = normalizeText(finalRow.student.hoTen)
  if (processName && finalName && processName !== finalName) {
    issues.push({
      level: 'warning',
      row: excelRow,
      column: 'Ho_Ten',
      message: `SV ${key}: họ tên ở file cuối kỳ ("${finalRow.student.hoTen}") khác file quá trình ("${processRow.student.hoTen}").`,
      suggestion: 'App giữ danh tính từ file quá trình; kiểm tra lại nếu file cuối kỳ đúng.'
    })
  }

  const processBirth = normalizeText(processRow.student.ngaySinh)
  const finalBirth = normalizeText(finalRow.student.ngaySinh)
  if (processBirth && finalBirth && processBirth !== finalBirth) {
    issues.push({
      level: 'warning',
      row: excelRow,
      column: 'Ngay_Sinh',
      message: `SV ${key}: ngày sinh ở file cuối kỳ ("${finalRow.student.ngaySinh}") khác file quá trình ("${processRow.student.ngaySinh}").`
    })
  }

  return issues
}

function compareMeta(
  processMeta: RawGrades['meta'],
  finalMeta: RawGrades['meta']
): ValidationIssue[] {
  const fields: { key: keyof RawGrades['meta']; label: string }[] = [
    { key: 'lop', label: 'Lớp' },
    { key: 'hocKy', label: 'Học kỳ' },
    { key: 'namHoc', label: 'Năm học' }
  ]

  const issues: ValidationIssue[] = []
  for (const field of fields) {
    const processValue = normalizeText(processMeta[field.key])
    const finalValue = normalizeText(finalMeta[field.key])
    if (processValue && finalValue && processValue !== finalValue) {
      issues.push({
        level: 'warning',
        message: `${field.label} ở file cuối kỳ ("${finalMeta[field.key]}") khác file quá trình ("${processMeta[field.key]}").`,
        suggestion: 'App giữ thông tin lớp/học kỳ/năm học từ file quá trình.'
      })
    }
  }
  return issues
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}
