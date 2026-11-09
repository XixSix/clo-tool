/**
 * Xuất báo cáo kết quả học phần: `final_grades_report.xlsx`
 *
 * Sheets:
 * - BANG_DIEM_QUA_TRINH : đúng mẫu Phụ lục 3 (bản Quá trình)
 * - BANG_DIEM_CUOI_KY   : đúng mẫu Phụ lục 3 (bản Cuối kỳ)
 * - BANG_DIEM_HOC_VU    : điểm danh + CC/GK/CK + điểm học phần
 * - CHI_TIET_CLO        : truy xuất điểm từng ô (đợt, CLO) + PLO
 * - TONG_HOP_LO         : % đạt CLO/PLO, TB/min/max, biểu đồ, ô đề xuất cải tiến
 * - CANH_BAO            : lỗi dữ liệu, SV thiếu dữ liệu / dưới ngưỡng
 */

import ExcelJS from 'exceljs'
import { numberToWordsVi } from '../utils/numberToWordsVi'
import {
  calculateGroupScores,
  calculatePhaseCloScores,
  computeAttendanceScores
} from '../calculator'
import { roundHalfUp } from '../rules'
import { allCloMappings, cloIdsByGroup } from '../utils/courseModel'
import type {
  Course,
  EvaluationReport,
  RawGrades,
  Student,
  StudentCourseResult,
  ValidationIssue
} from '../types'
import { renderBarChartPng } from './chartRenderer'
import {
  applyBorders,
  BORDER_THIN,
  formatDateVi,
  setWidths,
  styleCell,
  styleHeaderRow,
  styleTitle
} from './style'

export interface ReportContext {
  hocKy?: string
  namHoc?: string
  lop?: string
  giangVien?: string
  diaDanh?: string
  ngayBaoCao?: string
}

export interface FinalGradesOptions {
  phase?: Phase | 'both'
  context?: ReportContext
  rawFile?: RawGrades
  issues?: ValidationIssue[]
  /** Thông tin định danh sinh viên (mã SV, họ tên, ngày sinh) để in báo cáo. */
  students?: Student[]
}

type Phase = 'process' | 'final'

/** Ghép kết quả tính điểm với thông tin định danh sinh viên. */
interface StudentRow {
  student: Student
  result: StudentCourseResult
}

function buildStudentRows(report: EvaluationReport, students: Student[] = []): StudentRow[] {
  const byId = new Map(students.map((s) => [s.id, s]))
  return report.sinhVien.map((result, index) => {
    const student =
      byId.get(result.sinhVienId) ??
      ({
        id: result.sinhVienId,
        tt: index + 1,
        maSv: result.sinhVienId,
        ho: '',
        ten: '',
        hoTen: result.sinhVienId
      } satisfies Student)
    return { student, result }
  })
}

function phaseCloIdSet(course: Course, phase: Phase): Set<string> {
  return new Set(cloIdsByGroup(course, phase === 'process' ? ['CC', 'GK'] : ['CK']))
}

function tbcOfPhase(
  course: Course,
  result: StudentCourseResult,
  phase: Phase,
  cloIds: Set<string>
): { value?: number; words?: string } {
  const scores = calculatePhaseCloScores(course, result.dotDanhGia, phase)
  let sum = 0
  let count = 0
  for (const cloId of cloIds) {
    const score = scores[cloId]
    if (score === undefined) continue
    sum += score
    count++
  }
  if (count === 0) return {}
  const value = roundHalfUp(sum / count, 1)
  return { value, words: numberToWordsVi(value, 1, true) }
}

/** Sheet Phụ lục 3 (bản Quá trình hoặc Cuối kỳ) */
function buildCloGradeSheet(
  wb: ExcelJS.Workbook,
  course: Course,
  rows: StudentRow[],
  phase: Phase,
  ctx: ReportContext,
  sheetName = 'BANG_DIEM_QUA_TRINH'
): void {
  const ws = wb.addWorksheet(sheetName)
  const activeIds = phaseCloIdSet(course, phase)
  const cloList = course.cloList.filter((c) => activeIds.has(c.id))
  const cloCount = Math.max(cloList.length, 1)
  const colCount = 5 + cloCount + 3 // TT, Mã SV, Họ tên(2), Ngày sinh + CLO + TBC(2) + Ghi chú

  setWidths(ws, [6, 14, 16, 16, 12, ...Array(cloCount).fill(9), 14, 16, 18])
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
  }

  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = 'BẢNG GHI ĐIỂM HỌC PHẦN'
  styleTitle(ws, 1, colCount)

  ws.mergeCells(2, 1, 2, colCount)
  ws.getCell(2, 1).value = '(Hệ đại học chính quy)'
  styleCell(ws.getCell(2, 1), { align: 'center' })

  ws.mergeCells(3, 1, 3, colCount)
  ws.getCell(3, 1).value =
    `Học kỳ: ${ctx.hocKy ?? '........'}     Năm học: ${ctx.namHoc ?? '........'}`
  styleCell(ws.getCell(3, 1), { align: 'center', bold: true })

  ws.getCell(5, 1).value = '1. Bảng ghi điểm'
  styleCell(ws.getCell(5, 1), { bold: true })
  ws.getCell(5, 4).value = phase === 'process' ? '☑ Quá trình' : '☐ Quá trình'
  ws.getCell(5, 7).value = phase === 'final' ? '☑ Cuối kỳ' : '☐ Cuối kỳ'
  styleCell(ws.getCell(5, 4), { align: 'center', bold: phase === 'process' })
  styleCell(ws.getCell(5, 7), { align: 'center', bold: phase === 'final' })

  const infoRows: [string, string][] = [
    ['2. Tên học phần:', course.tenHp],
    ['3. Mã học phần:', course.maHp],
    ['4. Lớp:', ctx.lop ?? ''],
    ['5. Hình thức thi:', course.hinhThucThi],
    ['6. Số tín chỉ:', String(course.soTinChi)]
  ]
  infoRows.forEach(([label, value], idx) => {
    const rowNumber = 6 + idx
    ws.getCell(rowNumber, 1).value = label
    styleCell(ws.getCell(rowNumber, 1), { bold: true })
    ws.mergeCells(rowNumber, 1, rowNumber, 3)
    ws.getCell(rowNumber, 4).value = value
    ws.mergeCells(rowNumber, 4, rowNumber, colCount)
    styleCell(ws.getCell(rowNumber, 4), { bold: true })
  })

  // Header 2 tầng (dòng 12-13)
  const headerTop = 12
  const headerBottom = 13
  ws.mergeCells(headerTop, 1, headerBottom, 1)
  ws.mergeCells(headerTop, 2, headerBottom, 2)
  ws.mergeCells(headerTop, 3, headerBottom, 4)
  ws.mergeCells(headerTop, 5, headerBottom, 5)

  ws.getCell(headerTop, 1).value = 'TT'
  ws.getCell(headerTop, 2).value = 'Mã SV'
  ws.getCell(headerTop, 3).value = 'Họ và tên'
  ws.getCell(headerTop, 5).value = 'Ngày sinh'

  const cloStart = 6
  const cloEnd = cloStart + cloCount - 1
  ws.mergeCells(headerTop, cloStart, headerTop, cloEnd)
  ws.getCell(headerTop, cloStart).value = 'Điểm số theo chuẩn đầu ra học phần'

  const tbcStart = cloEnd + 1
  ws.mergeCells(headerTop, tbcStart, headerTop, tbcStart + 1)
  ws.getCell(headerTop, tbcStart).value = 'TBC CLO'

  ws.mergeCells(headerTop, tbcStart + 2, headerBottom, tbcStart + 2)
  ws.getCell(headerTop, tbcStart + 2).value = 'Ghi chú'

  cloList.forEach((clo, idx) => {
    ws.getCell(headerBottom, cloStart + idx).value = clo.maClo
  })
  ws.getCell(headerBottom, tbcStart).value = 'Bằng số (Trung bình cộng các CLO)'
  ws.getCell(headerBottom, tbcStart + 1).value = 'Bằng chữ'

  styleHeaderRow(ws, headerTop, colCount)
  styleHeaderRow(ws, headerBottom, colCount)
  applyBorders(ws, headerTop, headerBottom, 1, colCount)

  // Dữ liệu
  let rowNumber = headerBottom + 1
  for (const { student, result } of rows) {
    const row = ws.getRow(rowNumber)
    const phaseScores = calculatePhaseCloScores(course, result.dotDanhGia, phase)

    row.getCell(1).value = student.tt
    row.getCell(2).value = student.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = student.hoTen
    ws.mergeCells(rowNumber, 3, rowNumber, 4)
    row.getCell(5).value = formatDateVi(student.ngaySinh)

    cloList.forEach((clo, idx) => {
      row.getCell(cloStart + idx).value = phaseScores[clo.id] ?? ''
    })

    const tbc = tbcOfPhase(course, result, phase, activeIds)
    row.getCell(tbcStart).value = tbc.value ?? ''
    row.getCell(tbcStart + 1).value = tbc.words ?? ''
    row.getCell(tbcStart + 2).value = result.canhBao.length > 0 ? 'Có cảnh báo' : ''

    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c)
      styleCell(cell, { align: c >= 6 ? 'center' : 'left' })
      cell.border = BORDER_THIN
    }
    row.height = 22
    rowNumber++
  }

  // Chân bảng
  rowNumber += 2
  const dateText =
    ctx.ngayBaoCao ??
    `${ctx.diaDanh ?? '..........'}, ngày ...... tháng ...... năm ${new Date().getFullYear()}`
  ws.mergeCells(rowNumber, 1, rowNumber, colCount)
  ws.getCell(rowNumber, 1).value = dateText
  styleCell(ws.getCell(rowNumber, 1), { align: 'right', bold: true })

  rowNumber += 2
  const signStart = Math.max(1, Math.floor(colCount / 2))
  ws.mergeCells(rowNumber, signStart, rowNumber, colCount)
  ws.getCell(rowNumber, signStart).value = 'Giảng viên'
  styleCell(ws.getCell(rowNumber, signStart), { align: 'center', bold: true })

  rowNumber += 3
  ws.mergeCells(rowNumber, signStart, rowNumber, colCount)
  ws.getCell(rowNumber, signStart).value = ctx.giangVien ?? ''
  styleCell(ws.getCell(rowNumber, signStart), { align: 'center' })
}

/** Sheet BANG_DIEM_HOC_VU: điểm danh + nhóm + điểm học phần */
function buildCourseGradeSheet(
  wb: ExcelJS.Workbook,
  course: Course,
  rows: StudentRow[],
  rawFile: RawGrades | undefined,
  ctx: ReportContext
): void {
  const ws = wb.addWorksheet('BANG_DIEM_HOC_VU')
  const sessions = rawFile?.attendanceSessions.map((s) => s.label) ?? []
  const firstSessionColumn = 6
  const tailStart = firstSessionColumn + sessions.length
  const colCount = tailStart + 5 - 1

  setWidths(ws, [6, 14, 18, 18, 12, ...Array(sessions.length).fill(6), 9, 10, 10, 10, 12])
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = 'DANH SÁCH ĐIỂM DANH VÀ GHI ĐIỂM'
  styleTitle(ws, 1, colCount)

  ws.mergeCells(2, 1, 2, colCount)
  ws.getCell(2, 1).value =
    `Học phần: ${course.tenHp} (${course.maHp}) – Lớp: ${ctx.lop ?? ''} – Học kỳ ${ctx.hocKy ?? '...'} năm học ${ctx.namHoc ?? '...'}`
  styleCell(ws.getCell(2, 1), { align: 'center' })

  const headerRow = 4
  ws.getCell(headerRow, 1).value = 'TT'
  ws.getCell(headerRow, 2).value = 'Mã SV'
  ws.mergeCells(headerRow, 3, headerRow, 4)
  ws.getCell(headerRow, 3).value = 'Họ và tên'
  ws.getCell(headerRow, 5).value = 'Ngày sinh'

  sessions.forEach((label, idx) => {
    ws.getCell(headerRow, firstSessionColumn + idx).value = label
  })

  ;['Số buổi vắng', 'Điểm CC', 'Điểm GK', 'Điểm CK', 'Điểm học phần'].forEach((label, idx) => {
    ws.getCell(headerRow, tailStart + idx).value = label
  })

  styleHeaderRow(ws, headerRow, colCount)

  const attendance = rawFile
    ? computeAttendanceScores(
        rawFile.attendance.map((record) => ({
          maSv: record.maSv,
          marks: Object.entries(record.symbols).map(([label, kyHieu]) => ({
            buoiDiemDanhId: label,
            kyHieu
          }))
        }))
      )
    : { scores: [], byMaSv: {} as Record<string, number>, issues: [] }
  const attendanceMap = new Map(attendance.scores.map((a) => [a.maSv, a]))
  const symbolsBySv = new Map(rawFile?.attendance.map((a) => [a.maSv, a.symbols]) ?? [])

  let rowNumber = headerRow + 1
  for (const { student, result } of rows) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = student.tt
    row.getCell(2).value = student.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = student.hoTen
    ws.mergeCells(rowNumber, 3, rowNumber, 4)
    row.getCell(5).value = formatDateVi(student.ngaySinh)

    const symbols = symbolsBySv.get(student.maSv) ?? {}
    sessions.forEach((label, idx) => {
      row.getCell(firstSessionColumn + idx).value = symbols[label] ?? ''
    })

    const att = attendanceMap.get(student.maSv)
    const groupScores = calculateGroupScores(course, result.dotDanhGia)
    row.getCell(tailStart).value = att ? att.soVangKhongPhep + att.soVangCoPhep : ''
    row.getCell(tailStart + 1).value = groupScores.groupScores.CC.score
    row.getCell(tailStart + 2).value = groupScores.groupScores.GK.score
    row.getCell(tailStart + 3).value = groupScores.groupScores.CK.score
    row.getCell(tailStart + 4).value = result.diemHocPhan

    for (let c = 1; c <= colCount; c++) {
      styleCell(row.getCell(c), { align: c >= 5 ? 'center' : 'left' })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: colCount } }
  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: headerRow }]
}

/** Sheet CHI_TIET_CLO: truy xuất điểm từng ô */
function buildCloDetailSheet(wb: ExcelJS.Workbook, course: Course, rows: StudentRow[]): void {
  const ws = wb.addWorksheet('CHI_TIET_CLO')
  const cellRefs = allCloMappings(course)
  const cloList = course.cloList
  const ploList = course.ploList
  const colCount = 3 + cellRefs.length + cloList.length + ploList.length

  setWidths(ws, [
    6,
    14,
    22,
    ...Array(cellRefs.length).fill(11),
    ...Array(cloList.length).fill(9),
    ...Array(ploList.length).fill(9)
  ])
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  const headerRow = 1
  const headers = [
    'TT',
    'Mã SV',
    'Họ và tên',
    ...cellRefs.map((ref) => {
      const maClo = cloList.find((c) => c.id === ref.cloId)?.maClo ?? ref.cloId
      return `${ref.dot.id} – ${maClo}`
    }),
    ...cloList.map((c) => c.maClo),
    ...ploList.map((p) => p.maPlo)
  ]
  headers.forEach((h, idx) => {
    ws.getCell(headerRow, idx + 1).value = h
  })
  styleHeaderRow(ws, headerRow, colCount)

  let rowNumber = 2
  for (const { student, result } of rows) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = student.tt
    row.getCell(2).value = student.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = student.hoTen

    cellRefs.forEach((ref, idx) => {
      const dot = result.dotDanhGia.find((d) => d.dotDanhGiaId === ref.dot.id)
      row.getCell(4 + idx).value = dot?.clo.find((c) => c.cloId === ref.cloId)?.diem ?? ''
    })
    cloList.forEach((clo, idx) => {
      row.getCell(4 + cellRefs.length + idx).value =
        result.clo.find((c) => c.cloId === clo.id)?.diem ?? ''
    })
    ploList.forEach((plo, idx) => {
      row.getCell(4 + cellRefs.length + cloList.length + idx).value =
        result.plo.find((p) => p.ploId === plo.id)?.diem ?? ''
    })

    for (let c = 1; c <= colCount; c++) {
      styleCell(row.getCell(c), { align: c >= 4 ? 'center' : 'left' })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  ws.views = [{ state: 'frozen', xSplit: 3, ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colCount } }
}

/** Sheet TONG_HOP_LO + 2 biểu đồ */
function buildSummarySheet(wb: ExcelJS.Workbook, course: Course, report: EvaluationReport): void {
  const ws = wb.addWorksheet('TONG_HOP_LO')
  const summary = report.tongHop
  setWidths(ws, [18, 10, 12, 12, 14, 10, 10, 10, 4, 16, 14])

  ws.mergeCells(1, 1, 1, 8)
  ws.getCell(1, 1).value = 'TỔNG HỢP MỨC ĐỘ ĐÁP ỨNG CHUẨN ĐẦU RA HỌC PHẦN'
  styleTitle(ws, 1, 8)

  const headerRow = 3
  ;['CLO', 'Đạt', '% Đạt', 'Không đạt', '% Không đạt', 'TB', 'Thấp nhất', 'Cao nhất'].forEach(
    (h, idx) => {
      ws.getCell(headerRow, idx + 1).value = h
    }
  )
  styleHeaderRow(ws, headerRow, 8)

  let rowNumber = headerRow + 1
  for (const clo of course.cloList) {
    const stat = summary.clo.find((s) => s.cloId === clo.id)
    if (!stat) continue
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = clo.maClo
    row.getCell(2).value = stat.soSinhVienDat
    row.getCell(3).value = stat.tyLeDat
    row.getCell(4).value = stat.soSinhVienKhongDat
    row.getCell(5).value = stat.tyLeKhongDat
    row.getCell(6).value = stat.trungBinh
    row.getCell(7).value = stat.thapNhat
    row.getCell(8).value = stat.caoNhat
    for (let c = 1; c <= 8; c++) {
      styleCell(row.getCell(c), {
        align: c === 1 ? 'left' : 'center',
        fill: stat.duoiNguongCanhBao ? 'FFFDE2E2' : undefined,
        bold: stat.duoiNguongCanhBao
      })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  // Dòng tổng kết điểm học phần
  rowNumber++
  const courseRow = rowNumber
  ws.getCell(courseRow, 1).value = 'Điểm học phần'
  styleCell(ws.getCell(courseRow, 1), { bold: true })
  ws.getCell(courseRow, 2).value =
    `Đạt: ${summary.hocPhan.soSinhVienDat} (${summary.hocPhan.tyLeDat}%)`
  ws.mergeCells(courseRow, 2, courseRow, 4)
  ws.getCell(courseRow, 6).value = summary.hocPhan.trungBinh
  ws.getCell(courseRow, 7).value = summary.hocPhan.thapNhat
  ws.getCell(courseRow, 8).value = summary.hocPhan.caoNhat
  for (let c = 1; c <= 8; c++) {
    styleCell(ws.getCell(courseRow, c), { align: c === 1 ? 'left' : 'center', bold: true })
    ws.getCell(courseRow, c).border = BORDER_THIN
  }

  // Bảng PLO
  rowNumber += 2
  ws.getCell(rowNumber, 1).value = 'PLO'
  ws.getCell(rowNumber, 2).value = 'Đạt'
  ws.getCell(rowNumber, 3).value = '% Đạt'
  ws.getCell(rowNumber, 4).value = 'Không đạt'
  ws.getCell(rowNumber, 5).value = '% Không đạt'
  ws.getCell(rowNumber, 6).value = 'TB'
  styleHeaderRow(ws, rowNumber, 6)
  rowNumber++

  for (const plo of course.ploList) {
    const stat = summary.plo.find((s) => s.ploId === plo.id)
    if (!stat) continue
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = plo.maPlo
    row.getCell(2).value = stat.soSinhVienDat
    row.getCell(3).value = stat.tyLeDat
    row.getCell(4).value = stat.soSinhVienKhongDat
    row.getCell(5).value = stat.tyLeKhongDat
    row.getCell(6).value = stat.trungBinh
    for (let c = 1; c <= 6; c++) {
      styleCell(row.getCell(c), { align: c === 1 ? 'left' : 'center' })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  // Thông tin chung
  rowNumber += 1
  const info = [
    `Tổng số SV: ${summary.tongSinhVien}`,
    `SV vắng thi: ${summary.soSinhVienVangThi}`,
    `SV thiếu dữ liệu: ${summary.soSinhVienThieuDuLieu}`,
    `TBC CLO toàn lớp: ${roundHalfUp(
      report.sinhVien.reduce((sum, s) => sum + s.tbcClo, 0) / Math.max(1, report.sinhVien.length),
      1
    )}`,
    ...summary.canhBao
  ]
  for (const text of info) {
    ws.mergeCells(rowNumber, 1, rowNumber, 8)
    ws.getCell(rowNumber, 1).value = text
    styleCell(ws.getCell(rowNumber, 1), { size: 10 })
    rowNumber++
  }

  // Biểu đồ % SV đạt theo CLO
  const cloLabels = course.cloList.map((c) => c.maClo)
  const cloValues = course.cloList.map(
    (c) => summary.clo.find((s) => s.cloId === c.id)?.tyLeDat ?? 0
  )
  const pngClo = renderBarChartPng({
    title: '% Sinh viên đạt theo CLO',
    labels: cloLabels,
    values: cloValues,
    maxValue: 100,
    valueSuffix: '%',
    barColor: '#2563eb'
  })
  const imageIdClo = wb.addImage({ buffer: pngClo, extension: 'png' })
  ws.addImage(imageIdClo, {
    tl: { col: 9, row: 2 } as ExcelJS.Anchor,
    ext: { width: 720, height: 336 }
  })

  const ploLabels = course.ploList.map((p) => p.maPlo)
  const ploValues = course.ploList.map(
    (p) => summary.plo.find((s) => s.ploId === p.id)?.tyLeDat ?? 0
  )
  if (ploLabels.length > 0) {
    const pngPlo = renderBarChartPng({
      title: '% Sinh viên đạt theo PLO',
      labels: ploLabels,
      values: ploValues,
      maxValue: 100,
      valueSuffix: '%',
      barColor: '#059669'
    })
    const imageIdPlo = wb.addImage({ buffer: pngPlo, extension: 'png' })
    ws.addImage(imageIdPlo, {
      tl: { col: 9, row: 22 } as ExcelJS.Anchor,
      ext: { width: 720, height: 336 }
    })
  }

  // Ô đề xuất cải tiến
  const improvementRow = rowNumber + 1
  ws.mergeCells(improvementRow, 1, improvementRow, 8)
  ws.getCell(improvementRow, 1).value = 'PHÂN TÍCH VÀ ĐỀ XUẤT CẢI TIẾN'
  styleCell(ws.getCell(improvementRow, 1), { bold: true, fill: 'FFFEF3C7' })
  for (let r = improvementRow + 1; r <= improvementRow + 6; r++) {
    ws.mergeCells(r, 1, r, 8)
    for (let c = 1; c <= 8; c++) ws.getRow(r).getCell(c).border = BORDER_THIN
  }
}

/** Sheet CANH_BAO */
function buildWarningSheet(
  wb: ExcelJS.Workbook,
  course: Course,
  rows: StudentRow[],
  issues: ValidationIssue[]
): void {
  const ws = wb.addWorksheet('CANH_BAO')
  setWidths(ws, [8, 18, 16, 45, 40])

  ws.mergeCells(1, 1, 1, 5)
  ws.getCell(1, 1).value = 'CẢNH BÁO & DỮ LIỆU CẦN KIỂM TRA'
  styleTitle(ws, 1, 5)

  const headerRow = 3
  ;['STT', 'Mức độ', 'Vị trí', 'Nội dung', 'Gợi ý'].forEach((h, idx) => {
    ws.getCell(headerRow, idx + 1).value = h
  })
  styleHeaderRow(ws, headerRow, 5)

  let rowNumber = headerRow + 1
  let stt = 1

  const pushRow = (level: string, position: string, message: string, suggestion = ''): void => {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = stt++
    row.getCell(2).value = level === 'error' ? 'Lỗi' : 'Cảnh báo'
    row.getCell(3).value = position
    row.getCell(4).value = message
    row.getCell(5).value = suggestion
    for (let c = 1; c <= 5; c++) {
      styleCell(row.getCell(c), {
        align: c === 1 || c === 2 ? 'center' : 'left',
        wrap: true,
        fill: level === 'error' ? 'FFFDE2E2' : undefined,
        size: 10
      })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  for (const issue of issues) {
    const position = [
      issue.scope,
      issue.targetId,
      issue.row ? `dòng ${issue.row}` : '',
      issue.column
    ]
      .filter(Boolean)
      .join(', ')
    pushRow(issue.level, position, issue.message, issue.suggestion ?? '')
  }

  const nguongDatClo = course.quyTac.nguongDatClo
  for (const { student, result } of rows) {
    if (result.vangThiCuoiKy) {
      pushRow(
        'warning',
        student.maSv,
        `SV ${student.hoTen} (${student.maSv}) vắng thi cuối kỳ.`,
        'Điểm CLO/HP = 0.'
      )
    }
    if (result.thieuDuLieu) {
      pushRow(
        'warning',
        student.maSv,
        `SV ${student.hoTen} (${student.maSv}) còn ô điểm chưa nhập.`
      )
    }
    for (const issue of result.canhBao) {
      pushRow('warning', student.maSv, `SV ${student.hoTen} (${student.maSv}): ${issue.noiDung}`)
    }
    for (const clo of result.clo) {
      if (clo.diem < nguongDatClo) {
        const maClo = course.cloList.find((c) => c.id === clo.cloId)?.maClo ?? clo.cloId
        pushRow(
          'warning',
          student.maSv,
          `SV ${student.hoTen} (${student.maSv}): ${maClo} = ${clo.diem} < ${nguongDatClo}.`
        )
      }
    }
  }

  if (stt === 1) {
    ws.getCell(headerRow + 1, 1).value = 'Không có cảnh báo.'
    styleCell(ws.getCell(headerRow + 1, 1))
  }
}

export function buildFinalGradesWorkbook(
  course: Course,
  report: EvaluationReport,
  options: FinalGradesOptions = {}
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  const phase = options.phase ?? 'both'
  const ctx = options.context ?? {}
  const rows = buildStudentRows(report, options.students)

  if (phase !== 'final') {
    buildCloGradeSheet(wb, course, rows, 'process', ctx, 'BANG_DIEM_QUA_TRINH')
  }
  if (phase !== 'process') {
    buildCloGradeSheet(wb, course, rows, 'final', ctx, 'BANG_DIEM_CUOI_KY')
  }
  buildCourseGradeSheet(wb, course, rows, options.rawFile, ctx)
  buildCloDetailSheet(wb, course, rows)
  buildSummarySheet(wb, course, report)
  buildWarningSheet(wb, course, rows, options.issues ?? [])

  return wb
}

export async function writeFinalGradesReport(
  filePath: string,
  course: Course,
  report: EvaluationReport,
  options: FinalGradesOptions = {}
): Promise<void> {
  const wb = buildFinalGradesWorkbook(course, report, options)
  await wb.xlsx.writeFile(filePath)
}
