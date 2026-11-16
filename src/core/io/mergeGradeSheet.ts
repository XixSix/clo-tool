/**
 * Ghép dữ liệu điểm quá trình với điểm cuối kỳ theo Mã SV.
 *
 * Kết quả là một `GradeSheetData` đầy đủ để chạy lại toàn bộ engine (CLO/PLO/điểm HP)
 * bằng Config gốc. Điểm danh và danh tính của giai đoạn quá trình được giữ nguyên;
 * chỉ các cột CK và mã đề được lấy từ file cuối kỳ.
 */

import type { Course, GradeSheetData, SheetStudentRow, ValidationIssue } from '../types'
import { scoreColumns } from '../utils/courseModel'
import { finalConfig } from './phaseConfig'

export interface MergeGradeSheetResult {
  file: GradeSheetData
  issues: ValidationIssue[]
}

export function mergeGradeSheets(
  process: GradeSheetData,
  final: GradeSheetData,
  course: Course
): MergeGradeSheetResult {
  const finalCourse = finalConfig(course)
  const ckColumns = scoreColumns(finalCourse)
  const ckGroups = new Set(
    course.dotDanhGia.filter((dot) => dot.nhom === 'CK').map((dot) => dot.id)
  )
  const issues: ValidationIssue[] = []

  const finalByKey = new Map<string, { row: SheetStudentRow; excelRow?: number }>()
  final.sinhVien.forEach((row, index) => {
    const key = row.sinhVien.maSv.trim()
    const excelRow = final.dongExcelSinhVien?.[index]

    if (!key || key.startsWith('__MISSING_')) {
      issues.push({
        level: 'error',
        row: excelRow,
        column: 'Ma_SV',
        message: 'File cuối kỳ có dòng thiếu Mã SV.',
        scope: 'grade_sheet'
      })
      return
    }
    if (finalByKey.has(key)) {
      issues.push({
        level: 'error',
        row: excelRow,
        column: 'Ma_SV',
        message: `File cuối kỳ trùng Mã SV ${key}.`,
        scope: 'grade_sheet'
      })
      return
    }
    finalByKey.set(key, { row, excelRow })
  })

  const seenProcess = new Set<string>()
  const sinhVien: SheetStudentRow[] = process.sinhVien.map((processRow, index) => {
    const key = processRow.sinhVien.maSv.trim()
    const processExcelRow = process.dongExcelSinhVien?.[index]

    if (!key || key.startsWith('__MISSING_')) {
      issues.push({
        level: 'error',
        row: processExcelRow,
        column: 'Ma_SV',
        message: 'File quá trình có dòng thiếu Mã SV.',
        scope: 'grade_sheet'
      })
    } else if (seenProcess.has(key)) {
      issues.push({
        level: 'error',
        row: processExcelRow,
        column: 'Ma_SV',
        message: `File quá trình trùng Mã SV ${key}.`,
        scope: 'grade_sheet'
      })
    }
    seenProcess.add(key)

    const finalMatch = finalByKey.get(key)
    let diem = processRow.diem

    if (!finalMatch) {
      const diemCacCot = { ...processRow.diem.diemCacCot }
      for (const maCot of ckColumns) diemCacCot[maCot] = null
      diem = { ...processRow.diem, diemCacCot }
      issues.push({
        level: 'warning',
        row: processExcelRow,
        column: 'Ma_SV',
        message: `SV ${key}: không có trong file cuối kỳ; các cột CK để trống và tính 0 điểm.`,
        scope: 'grade_sheet'
      })
    } else {
      finalByKey.delete(key)
      const { row: finalRow, excelRow: finalExcelRow } = finalMatch
      const diemCacCot = { ...processRow.diem.diemCacCot }
      for (const maCot of ckColumns) {
        diemCacCot[maCot] = finalRow.diem.diemCacCot[maCot] ?? null
      }
      // Mã đề CK gắn theo từng đợt đánh giá để không lọc mất câu của CC/GK
      const finalMaDeTheoDauDiem = finalRow.diem.maDeTheoDauDiem ?? {}
      const maDeTheoDauDiem = { ...processRow.diem.maDeTheoDauDiem }
      for (const maDauDiem of ckGroups) {
        if (finalMaDeTheoDauDiem[maDauDiem]) {
          maDeTheoDauDiem[maDauDiem] = finalMaDeTheoDauDiem[maDauDiem]
        }
      }
      diem = {
        maDeTheoDauDiem,
        diemCacCot,
      }
      issues.push(...compareIdentity(processRow, finalRow, key, finalExcelRow))
    }

    return {
      sinhVien: { ...processRow.sinhVien, tt: index + 1 },
      diem,
      diemDanh: processRow.diemDanh,
      ghiChu: processRow.ghiChu ?? finalMatch?.row.ghiChu
    }
  })

  for (const [key, match] of finalByKey) {
    issues.push({
      level: 'error',
      row: match.excelRow,
      column: 'Ma_SV',
      message: `SV ${key}: chỉ có trong file cuối kỳ, thiếu dữ liệu quá trình.`,
      scope: 'grade_sheet'
    })
  }

  issues.push(...compareMeta(process.thongTin, final.thongTin))

  return {
    file: {
      thongTin: process.thongTin,
      sinhVien,
      buoiDiemDanh: process.buoiDiemDanh,
      diemToiDaKhaiBao: process.diemToiDaKhaiBao,
      dongExcelSinhVien: process.dongExcelSinhVien
    },
    issues
  }
}

function compareIdentity(
  processRow: SheetStudentRow,
  finalRow: SheetStudentRow,
  key: string,
  excelRow?: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const processName = normalizeText(processRow.sinhVien.hoTen)
  const finalName = normalizeText(finalRow.sinhVien.hoTen)
  if (processName && finalName && processName !== finalName) {
    issues.push({
      level: 'warning',
      row: excelRow,
      column: 'Ho_Ten',
      message: `SV ${key}: họ tên ở file cuối kỳ ("${finalRow.sinhVien.hoTen}") khác file quá trình ("${processRow.sinhVien.hoTen}").`,
      suggestion: 'App giữ danh tính từ file quá trình; kiểm tra lại nếu file cuối kỳ đúng.',
      scope: 'grade_sheet'
    })
  }

  const processBirth = normalizeText(processRow.sinhVien.ngaySinh)
  const finalBirth = normalizeText(finalRow.sinhVien.ngaySinh)
  if (processBirth && finalBirth && processBirth !== finalBirth) {
    issues.push({
      level: 'warning',
      row: excelRow,
      column: 'Ngay_Sinh',
      message: `SV ${key}: ngày sinh ở file cuối kỳ ("${finalRow.sinhVien.ngaySinh}") khác file quá trình ("${processRow.sinhVien.ngaySinh}").`,
      scope: 'grade_sheet'
    })
  }

  return issues
}

function compareMeta(
  processMeta: GradeSheetData['thongTin'],
  finalMeta: GradeSheetData['thongTin']
): ValidationIssue[] {
  const fields: { key: keyof GradeSheetData['thongTin']; label: string }[] = [
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
        suggestion: 'App giữ thông tin lớp/học kỳ/năm học từ file quá trình.',
        scope: 'grade_sheet'
      })
    }
  }
  return issues
}

function normalizeText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
}