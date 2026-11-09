/**
 * Xuất báo cáo phân tích đề thi: `exam_analysis_report.xlsx`
 *
 * Sheets:
 * - P_D_TUNG_CAU  : p, d, mức độ, cảnh báo từng câu (theo từng đợt / mã đề)
 * - DO_TIN_CAY    : Cronbach's alpha, mức độ, "α nếu bỏ câu", cảnh báo cỡ mẫu
 * - GOI_Y_CAI_TIEN: khung 5 câu hỏi theo Lưu ý QLCL
 */

import ExcelJS from 'exceljs'
import type { Course, ExamPsychometrics, ValidationIssue } from '../types'
import { allQuestions } from '../utils/courseModel'
import {
  applyBorders,
  BORDER_THIN,
  setWidths,
  styleCell,
  styleHeaderRow,
  styleTitle
} from './style'

export function buildExamAnalysisWorkbook(
  course: Course,
  exams: ExamPsychometrics[],
  issues: ValidationIssue[] = []
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  buildItemSheet(wb, exams)
  buildReliabilitySheet(wb, exams, issues)
  buildSuggestionSheet(wb, course, exams)

  return wb
}

function buildItemSheet(wb: ExcelJS.Workbook, exams: ExamPsychometrics[]): void {
  const ws = wb.addWorksheet('P_D_TUNG_CAU')
  const colCount = 9
  setWidths(ws, [16, 10, 12, 10, 16, 10, 18, 12, 34])
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = 'PHÂN TÍCH ĐỘ KHÓ – ĐỘ PHÂN BIỆT TỪNG CÂU'
  styleTitle(ws, 1, colCount)

  let rowNumber = 3
  for (const exam of exams) {
    ws.mergeCells(rowNumber, 1, rowNumber, colCount)
    ws.getCell(rowNumber, 1).value =
      `Đợt: ${exam.maDauDiem} – Mã đề: ${exam.maDe} – Số SV hợp lệ: ${exam.soSinhVien}`
    styleCell(ws.getCell(rowNumber, 1), { bold: true, fill: 'FFE0F2FE' })
    rowNumber++

    ;[
      'Câu',
      'Điểm tối đa',
      'Điểm TB',
      'p',
      'Mức độ khó',
      'd',
      'Mức độ phân biệt',
      'α nếu bỏ câu',
      'Cảnh báo'
    ].forEach((h, idx) => {
      ws.getCell(rowNumber, idx + 1).value = h
    })
    styleHeaderRow(ws, rowNumber, colCount)
    rowNumber++

    for (const item of exam.items) {
      const row = ws.getRow(rowNumber)
      row.getCell(1).value = item.cau
      row.getCell(2).value = item.diemToiDa
      row.getCell(3).value = item.diemTrungBinh
      row.getCell(4).value = item.doKhoP
      row.getCell(5).value = item.mucDoKho
      row.getCell(6).value = item.doPhanBietD
      row.getCell(7).value = item.mucDoPhanBiet
      row.getCell(8).value = item.alphaNeuBoCau
      row.getCell(9).value = item.canhBao ?? ''

      const isBad = item.doPhanBietD < 0 || item.doKhoP < 0.2 || item.doKhoP >= 0.8
      for (let c = 1; c <= colCount; c++) {
        styleCell(row.getCell(c), {
          align: c === 1 || c >= 5 ? 'left' : 'center',
          wrap: c === 9,
          fill: isBad ? 'FFFEF3C7' : undefined
        })
        row.getCell(c).border = BORDER_THIN
      }
      rowNumber++
    }

    if (exam.canhBaoCoMauN) {
      ws.mergeCells(rowNumber, 1, rowNumber, colCount)
      ws.getCell(rowNumber, 1).value = `⚠ ${exam.canhBaoCoMauN}`
      styleCell(ws.getCell(rowNumber, 1), { color: 'FFB91C1C', size: 10 })
      rowNumber++
    }
    rowNumber += 2
  }
}

function buildReliabilitySheet(
  wb: ExcelJS.Workbook,
  exams: ExamPsychometrics[],
  issues: ValidationIssue[]
): void {
  const ws = wb.addWorksheet('DO_TIN_CAY')
  const colCount = 6
  setWidths(ws, [18, 26, 14, 20, 46, 18])
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = "ĐỘ TIN CẬY CỦA ĐỀ THI (CRONBACH'S ALPHA)"
  styleTitle(ws, 1, colCount)

  const headerRow = 3
  ;['Đợt', 'Mã đề', 'Số SV', 'Cronbach α', 'Mức độ tin cậy', 'Cảnh báo cỡ mẫu'].forEach(
    (h, idx) => {
      ws.getCell(headerRow, idx + 1).value = h
    }
  )
  styleHeaderRow(ws, headerRow, colCount)

  let rowNumber = headerRow + 1
  for (const exam of exams) {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = exam.maDauDiem
    row.getCell(2).value = exam.maDe
    row.getCell(3).value = exam.soSinhVien
    row.getCell(4).value = exam.cronbachAlpha
    row.getCell(5).value = exam.mucDoTinCay
    row.getCell(6).value = exam.canhBaoCoMauN ?? ''
    for (let c = 1; c <= colCount; c++) {
      styleCell(row.getCell(c), { align: c === 6 ? 'left' : 'center', wrap: c === 6 })
      row.getCell(c).border = BORDER_THIN
    }
    rowNumber++
  }

  rowNumber++
  ws.getCell(rowNumber, 1).value = 'Diễn giải "α nếu bỏ câu"'
  styleCell(ws.getCell(rowNumber, 1), { bold: true })
  ws.mergeCells(rowNumber, 1, rowNumber, colCount)
  rowNumber++
  const notes = [
    'α nếu bỏ câu > α của đề: câu đó đang làm giảm độ tin cậy, nên xem lại hoặc loại bỏ.',
    'α nếu bỏ câu < α của đề: câu đó đóng góp tích cực cho độ tin cậy.',
    'QĐ450 ghi chồng lấn tại α = 0,60; app áp dụng "≤ 0,60 là Không đủ độ tin cậy".'
  ]
  for (const note of notes) {
    ws.mergeCells(rowNumber, 1, rowNumber, colCount)
    ws.getCell(rowNumber, 1).value = `• ${note}`
    styleCell(ws.getCell(rowNumber, 1), { size: 10, wrap: true })
    rowNumber++
  }

  if (issues.length > 0) {
    rowNumber += 1
    ws.mergeCells(rowNumber, 1, rowNumber, colCount)
    ws.getCell(rowNumber, 1).value = 'LỖI / CẢNH BÁO DỮ LIỆU'
    styleCell(ws.getCell(rowNumber, 1), { bold: true, fill: 'FFFDE2E2' })
    rowNumber++
    for (const issue of issues) {
      ws.mergeCells(rowNumber, 1, rowNumber, colCount)
      ws.getCell(rowNumber, 1).value =
        `[${issue.level === 'error' ? 'Lỗi' : 'Cảnh báo'}] ${issue.message}`
      styleCell(ws.getCell(rowNumber, 1), { size: 10, wrap: true })
      rowNumber++
    }
  }
}

function buildSuggestionSheet(
  wb: ExcelJS.Workbook,
  course: Course,
  exams: ExamPsychometrics[]
): void {
  const ws = wb.addWorksheet('GOI_Y_CAI_TIEN')
  const colCount = 3
  setWidths(ws, [8, 58, 60])
  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }

  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = 'ĐỊNH HƯỚNG CẢI TIẾN CHẤT LƯỢNG ĐỀ THI VÀ DẠY HỌC'
  styleTitle(ws, 1, colCount)

  const headerRow = 3
  ;['STT', 'Câu hỏi theo Lưu ý QLCL', 'Trả lời / Đề xuất của giảng viên'].forEach((h, idx) => {
    ws.getCell(headerRow, idx + 1).value = h
  })
  styleHeaderRow(ws, headerRow, colCount)

  const coverage = course.cloList
    .map((clo) => {
      const items = course.dotDanhGia.filter((dot) =>
        dot.cloList.some((mapping) => mapping.cloId === clo.id)
      )
      const weights = items.map((dot) => `${dot.id} ${dot.trongSoPhanTram}%`).join(', ')
      return `${clo.maClo}: ${weights || 'chưa đo'}`
    })
    .join('\n')

  const lowClo = exams
    .flatMap((e) => e.items)
    .filter((i) => i.doPhanBietD < 0 || i.doKhoP < 0.2 || i.doKhoP >= 0.8)
    .map((i) => `${i.cau} (p=${i.doKhoP}, d=${i.doPhanBietD})`)
    .join('; ')

  const questions: [string, string][] = [
    ['1. CLO của học phần được đo ở những đầu điểm nào?', coverage],
    [
      '2. Mỗi câu hỏi đo CLO nào và ở mức năng lực nào?',
      allQuestions(course)
        .map(({ cauHoi }) => {
          const maClo = course.cloList.find((c) => c.id === cauHoi.cloId)?.maClo ?? cauHoi.cloId
          return `${cauHoi.cau || cauHoi.id} → ${maClo} (tối đa ${cauHoi.diemToiDa})`
        })
        .join('\n')
    ],
    [
      '3. Bao nhiêu % sinh viên đạt từng CLO? CLO nào thấp nhất?',
      'Xem sheet TONG_HOP_LO của file final_grades_report.xlsx.'
    ],
    [
      '4. Câu hỏi / nội dung nào cần cải tiến?',
      lowClo
        ? `Các câu cần xem lại: ${lowClo}`
        : 'Chưa phát hiện câu bất thường theo ngưỡng p/d hiện hành.'
    ],
    [
      '5. Kết quả sau cải tiến (học kỳ sau)?',
      '...............................................................................'
    ]
  ]

  let rowNumber = headerRow + 1
  questions.forEach(([question, answer], idx) => {
    const row = ws.getRow(rowNumber)
    row.getCell(1).value = idx + 1
    row.getCell(2).value = question
    row.getCell(3).value = answer
    for (let c = 1; c <= colCount; c++) {
      styleCell(row.getCell(c), { align: c === 1 ? 'center' : 'left', wrap: true, size: 10 })
      row.getCell(c).border = BORDER_THIN
    }
    row.height = 90
    rowNumber++
  })

  rowNumber += 1
  ws.mergeCells(rowNumber, 1, rowNumber, colCount)
  ws.getCell(rowNumber, 1).value =
    'Giảng viên ký tên: ....................................................'
  styleCell(ws.getCell(rowNumber, 1), { bold: true })
  applyBorders(ws, headerRow, rowNumber - 1, 1, colCount)
}

export async function writeExamAnalysisReport(
  filePath: string,
  course: Course,
  exams: ExamPsychometrics[],
  issues: ValidationIssue[] = []
): Promise<void> {
  const wb = buildExamAnalysisWorkbook(course, exams, issues)
  await wb.xlsx.writeFile(filePath)
}
