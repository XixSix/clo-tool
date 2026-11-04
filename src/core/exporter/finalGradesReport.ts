/**
 * Xuất báo cáo kết quả học phần: `final_grades_report.xlsx`
 *
 * Sheets:
 * - BANG_DIEM_QUA_TRINH : đúng mẫu Phụ lục 3 (bản Quá trình)
 * - BANG_DIEM_CUOI_KY   : đúng mẫu Phụ lục 3 (bản Cuối kỳ)
 * - BANG_DIEM_HOC_VU    : điểm danh + CC/GK/CK + điểm học phần
 * - CHI_TIET_CLO      : truy xuất điểm từng ô (đầu điểm, CLO) + PLO
 * - TONG_HOP_LO       : % đạt CLO/PLO, TB/min/max, biểu đồ, ô đề xuất cải tiến
 * - CANH_BAO          : lỗi dữ liệu, SV thiếu dữ liệu / dưới ngưỡng
 */

import ExcelJS from 'exceljs'
import { numberToWordsVi } from '../utils/numberToWordsVi'
import { computeAttendanceScores } from '../calculator'
import { roundHalfUp } from '../rules'
import type {
  CourseConfig,
  EvaluationResult,
  ProcessedStudentResult,
  RawGrades,
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

type Phase = 'process' | 'final'

function cloScoreOf(
  student: ProcessedStudentResult,
  clo: string,
  phase: Phase
): number | undefined {
  return phase === 'process' ? student.processCloScores[clo] : student.finalCloScores[clo]
}

function tbcOfPhase(
  config: CourseConfig,
  student: ProcessedStudentResult,
  phase: Phase,
  cloCodes: string[]
): { value?: number; words?: string } {
  // TBC CLO của đợt = trung bình cộng thuần các CLO có mặt trong đợt đó
  let sum = 0
  let count = 0
  for (const clo of config.cloList) {
    if (!cloCodes.includes(clo.maClo)) continue
    const score = cloScoreOf(student, clo.maClo, phase)
    if (score === undefined) continue
    sum += score
    count++
  }
  if (count === 0) return {}
  const value = roundHalfUp(sum / count, 1)
  return { value, words: numberToWordsVi(value, 1, true) }
}

/** Các CLO có mặt trong bản Quá trình (CC/GK) hoặc Cuối kỳ (CK) */
function activeCloCodes(config: CourseConfig, phase: Phase): string[] {
  const groups = phase === 'process' ? ['CC', 'GK'] : ['CK']
  const codes = new Set(
    config.keHoachDanhGia.filter((p) => groups.includes(p.nhom)).map((p) => p.clo)
  )
  return config.cloList.map((c) => c.maClo).filter((code) => codes.has(code))
}

/** Sheet Phụ lục 3 (bản Quá trình hoặc Cuối kỳ) */
function buildCloGradeSheet(
  wb: ExcelJS.Workbook,
  config: CourseConfig,
  students: ProcessedStudentResult[],
  phase: Phase,
  ctx: ReportContext,
  sheetName = 'BANG_DIEM_QUA_TRINH'
): void {
  const ws = wb.addWorksheet(sheetName)
  const activeCodes = activeCloCodes(config, phase)
  const cloList = config.cloList.filter((c) => activeCodes.includes(c.maClo))
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
    ['2. Tên học phần:', config.courseInfo.tenHp],
    ['3. Mã học phần:', config.courseInfo.maHp],
    ['4. Lớp:', ctx.lop ?? ''],
    ['5. Hình thức thi:', config.courseInfo.hinhThucThi],
    ['6. Số tín chỉ:', String(config.courseInfo.soTinChi)]
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
  for (const st of students) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = st.tt
    row.getCell(2).value = st.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = st.hoTen
    ws.mergeCells(rowNumber, 3, rowNumber, 4)
    row.getCell(5).value = formatDateVi(st.ngaySinh)

    cloList.forEach((clo, idx) => {
      const score = cloScoreOf(st, clo.maClo, phase)
      row.getCell(cloStart + idx).value = score ?? ''
    })

    const tbc = tbcOfPhase(config, st, phase, activeCodes)
    row.getCell(tbcStart).value = tbc.value ?? ''
    row.getCell(tbcStart + 1).value = tbc.words ?? ''
    row.getCell(tbcStart + 2).value = st.issues.length > 0 ? 'Có cảnh báo' : ''

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
  config: CourseConfig,
  result: EvaluationResult,
  rawFile: RawGrades | undefined,
  ctx: ReportContext
): void {
  const ws = wb.addWorksheet('BANG_DIEM_HOC_VU')
  const sessions = rawFile?.attendanceSessions ?? []
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
    `Học phần: ${config.courseInfo.tenHp} (${config.courseInfo.maHp}) – Lớp: ${ctx.lop ?? ''} – Học kỳ ${ctx.hocKy ?? '...'} năm học ${ctx.namHoc ?? '...'}`
  styleCell(ws.getCell(2, 1), { align: 'center' })

  const headerRow = 4
  ws.getCell(headerRow, 1).value = 'TT'
  ws.getCell(headerRow, 2).value = 'Mã SV'
  ws.mergeCells(headerRow, 3, headerRow, 4)
  ws.getCell(headerRow, 3).value = 'Họ và tên'
  ws.getCell(headerRow, 5).value = 'Ngày sinh'

  sessions.forEach((s, idx) => {
    ws.getCell(headerRow, firstSessionColumn + idx).value = s.label
  })

  ;['Số buổi vắng', 'Điểm CC', 'Điểm GK', 'Điểm CK', 'Điểm học phần'].forEach((label, idx) => {
    ws.getCell(headerRow, tailStart + idx).value = label
  })

  styleHeaderRow(ws, headerRow, colCount)

  const attendance = rawFile
    ? computeAttendanceScores(rawFile.attendance, config.diemDanh ?? [])
    : { scores: [], byMaSv: {} as Record<string, number>, issues: [] }
  const attendanceMap = new Map(attendance.scores.map((a) => [a.maSv, a]))
  const symbolsBySv = new Map(rawFile?.attendance.map((a) => [a.maSv, a.symbols]) ?? [])

  let rowNumber = headerRow + 1
  for (const st of result.students) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = st.tt
    row.getCell(2).value = st.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = st.hoTen
    ws.mergeCells(rowNumber, 3, rowNumber, 4)
    row.getCell(5).value = formatDateVi(st.ngaySinh)

    const symbols = symbolsBySv.get(st.maSv) ?? {}
    sessions.forEach((s, idx) => {
      row.getCell(firstSessionColumn + idx).value = symbols[s.label] ?? ''
    })

    const att = attendanceMap.get(st.maSv)
    row.getCell(tailStart).value = att ? att.soVangKhongPhep + att.soVangCoPhep : ''
    row.getCell(tailStart + 1).value = st.groupScores.CC.score
    row.getCell(tailStart + 2).value = st.groupScores.GK.score
    row.getCell(tailStart + 3).value = st.groupScores.CK.score
    row.getCell(tailStart + 4).value = st.courseScore

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
function buildCloDetailSheet(
  wb: ExcelJS.Workbook,
  config: CourseConfig,
  result: EvaluationResult
): void {
  const ws = wb.addWorksheet('CHI_TIET_CLO')
  const cellKeys = config.keHoachDanhGia.map((p) => `${p.maDauDiem}_${p.clo}`)
  const uniqueCellKeys = Array.from(new Set(cellKeys))
  const ploCodes = Array.from(new Set(config.maTranPlo.map((m) => m.plo)))
  const colCount = 3 + uniqueCellKeys.length + config.cloList.length + ploCodes.length

  setWidths(ws, [
    6,
    14,
    22,
    ...Array(uniqueCellKeys.length).fill(11),
    ...Array(config.cloList.length).fill(9),
    ...Array(ploCodes.length).fill(9)
  ])
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  const headerRow = 1
  const headers = [
    'TT',
    'Mã SV',
    'Họ và tên',
    ...uniqueCellKeys.map((k) => k.replace('_', ' – ')),
    ...config.cloList.map((c) => c.maClo),
    ...ploCodes
  ]
  headers.forEach((h, idx) => {
    ws.getCell(headerRow, idx + 1).value = h
  })
  styleHeaderRow(ws, headerRow, colCount)

  let rowNumber = 2
  for (const st of result.students) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = st.tt
    row.getCell(2).value = st.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = st.hoTen

    uniqueCellKeys.forEach((key, idx) => {
      row.getCell(4 + idx).value = st.cellScores[key]?.score ?? ''
    })
    config.cloList.forEach((clo, idx) => {
      row.getCell(4 + uniqueCellKeys.length + idx).value = st.cloScores[clo.maClo] ?? ''
    })
    ploCodes.forEach((plo, idx) => {
      row.getCell(4 + uniqueCellKeys.length + config.cloList.length + idx).value =
        st.ploScores[plo] ?? ''
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
function buildSummarySheet(
  wb: ExcelJS.Workbook,
  config: CourseConfig,
  result: EvaluationResult
): void {
  const ws = wb.addWorksheet('TONG_HOP_LO')
  const summary = result.summary
  setWidths(ws, [18, 10, 12, 12, 14, 10, 10, 10, 4, 16, 14])

  ws.mergeCells(1, 1, 1, 8)
  ws.getCell(1, 1).value = 'TỔNG HỢP MỨC ĐỘ ĐẠP ỨNG CHUẨN ĐẦU RA HỌC PHẦN'
  styleTitle(ws, 1, 8)

  const headerRow = 3
  ;['CLO', 'Đạt', '% Đạt', 'Không đạt', '% Không đạt', 'TB', 'Thấp nhất', 'Cao nhất'].forEach(
    (h, idx) => {
      ws.getCell(headerRow, idx + 1).value = h
    }
  )
  styleHeaderRow(ws, headerRow, 8)

  let rowNumber = headerRow + 1
  for (const clo of config.cloList) {
    const stat = summary.cloStats[clo.maClo]
    if (!stat) continue
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = clo.maClo
    row.getCell(2).value = stat.passedCount
    row.getCell(3).value = stat.passedPercent
    row.getCell(4).value = stat.failedCount
    row.getCell(5).value = stat.failedPercent
    row.getCell(6).value = stat.mean
    row.getCell(7).value = stat.min
    row.getCell(8).value = stat.max
    for (let c = 1; c <= 8; c++) {
      styleCell(row.getCell(c), {
        align: c === 1 ? 'left' : 'center',
        fill: stat.isBelowThreshold ? 'FFFDE2E2' : undefined,
        bold: stat.isBelowThreshold
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
    `Đạt: ${summary.courseStat.passedCount} (${summary.courseStat.passedPercent}%)`
  ws.mergeCells(courseRow, 2, courseRow, 4)
  ws.getCell(courseRow, 6).value = summary.courseStat.mean
  ws.getCell(courseRow, 7).value = summary.courseStat.min
  ws.getCell(courseRow, 8).value = summary.courseStat.max
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

  for (const [ploCode, stat] of Object.entries(summary.ploStats)) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = ploCode
    row.getCell(2).value = stat.passedCount
    row.getCell(3).value = stat.passedPercent
    row.getCell(4).value = stat.failedCount
    row.getCell(5).value = stat.failedPercent
    row.getCell(6).value = stat.mean
    for (let c = 1; c <= 6; c++) {
      styleCell(row.getCell(c), { align: c === 1 ? 'left' : 'center' })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  // Thông tin chung
  rowNumber += 1
  const info = [
    `Tổng số SV: ${summary.totalStudents}`,
    `SV vắng thi: ${summary.absentStudents}`,
    `SV thiếu dữ liệu: ${summary.missingDataStudents}`,
    `TBC CLO toàn lớp: ${roundHalfUp(
      result.students.reduce((sum, s) => sum + s.tbcClo, 0) / Math.max(1, result.students.length),
      1
    )}`,
    ...summary.generalWarnings
  ]
  for (const text of info) {
    ws.mergeCells(rowNumber, 1, rowNumber, 8)
    ws.getCell(rowNumber, 1).value = text
    styleCell(ws.getCell(rowNumber, 1), { size: 10 })
    rowNumber++
  }

  // Biểu đồ % SV đạt theo CLO
  const cloLabels = config.cloList.map((c) => c.maClo)
  const cloValues = config.cloList.map((c) => summary.cloStats[c.maClo]?.passedPercent ?? 0)
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

  const ploLabels = Object.keys(summary.ploStats)
  const ploValues = ploLabels.map((p) => summary.ploStats[p].passedPercent)
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
  config: CourseConfig,
  result: EvaluationResult,
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
    const position = [issue.sheet, issue.row ? `dòng ${issue.row}` : '', issue.column]
      .filter(Boolean)
      .join(', ')
    pushRow(issue.level, position, issue.message, issue.suggestion ?? '')
  }

  for (const st of result.students) {
    if (st.isAbsentFinal) {
      pushRow(
        'warning',
        st.maSv,
        `SV ${st.hoTen} (${st.maSv}) vắng thi cuối kỳ.`,
        'Điểm CLO/HP = 0.'
      )
    }
    if (st.hasMissingData) {
      pushRow('warning', st.maSv, `SV ${st.hoTen} (${st.maSv}) còn ô điểm chưa nhập.`)
    }
    for (const issue of st.issues) {
      pushRow('warning', st.maSv, `SV ${st.hoTen} (${st.maSv}): ${issue.message}`)
    }
    for (const [clo, score] of Object.entries(st.cloScores)) {
      if (score < config.quyTac.nguong_dat_clo) {
        pushRow(
          'warning',
          st.maSv,
          `SV ${st.hoTen} (${st.maSv}): ${clo} = ${score} < ${config.quyTac.nguong_dat_clo}.`
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
  config: CourseConfig,
  result: EvaluationResult,
  options: {
    phase?: Phase | 'both'
    context?: ReportContext
    rawFile?: RawGrades
    issues?: ValidationIssue[]
  } = {}
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  const phase = options.phase ?? 'both'
  const ctx = options.context ?? {}

  if (phase !== 'final') {
    buildCloGradeSheet(wb, config, result.students, 'process', ctx, 'BANG_DIEM_QUA_TRINH')
  }
  if (phase !== 'process') {
    buildCloGradeSheet(wb, config, result.students, 'final', ctx, 'BANG_DIEM_CUOI_KY')
  }
  buildCourseGradeSheet(wb, config, result, options.rawFile, ctx)
  buildCloDetailSheet(wb, config, result)
  buildSummarySheet(wb, config, result)
  buildWarningSheet(wb, config, result, options.issues ?? [])

  return wb
}

export async function writeFinalGradesReport(
  filePath: string,
  config: CourseConfig,
  result: EvaluationResult,
  options: {
    phase?: Phase | 'both'
    context?: ReportContext
    rawFile?: RawGrades
    issues?: ValidationIssue[]
  } = {}
): Promise<void> {
  const wb = buildFinalGradesWorkbook(config, result, options)
  await wb.xlsx.writeFile(filePath)
}
