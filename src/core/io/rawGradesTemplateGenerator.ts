/** Sinh Template_DiemTho.xlsx. */

import ExcelJS from 'exceljs'
import type { CourseConfig, RawStudentRow } from '../types'
import { setWidths, styleCell, styleHeaderRow, styleTitle, BORDER_THIN } from '../exporter/style'

const INPUT_FILL = 'FFFEF9C3'

export interface RawTemplateOptions {
  students?: RawStudentRow[]
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
  sessions?: { label: string; date?: Date }[]
  attendance?: Record<string, Record<string, string>>
}

export function buildRawGradesWorkbook(
  config: CourseConfig,
  options: RawTemplateOptions = {}
): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  const ws = wb.addWorksheet('NHAP_LIEU')
  const sessions =
    options.sessions ?? Array.from({ length: 12 }, (_, i) => ({ label: `Buổi ${i + 1}` }))
  const scoreColumns = Array.from(new Set(config.cauHoi.map((q) => q.maCotDiem)))
  const maxScoreByColumn = new Map<string, number>()
  for (const q of config.cauHoi) {
    if (!maxScoreByColumn.has(q.maCotDiem)) maxScoreByColumn.set(q.maCotDiem, q.diemToiDa)
  }

  const colCount = 5 + sessions.length + scoreColumns.length + 1
  setWidths(ws, [
    6,
    14,
    18,
    12,
    13,
    ...Array(sessions.length).fill(7),
    ...scoreColumns.map(() => 13),
    20
  ])

  // Tiêu đề
  ws.mergeCells(1, 1, 1, colCount)
  ws.getCell(1, 1).value = 'ĐIỂM DANH + NHẬP ĐIỂM – TỰ ĐỘNG TÍNH CLO'
  styleTitle(ws, 1, colCount)

  // Thông tin lớp
  const metaRow = 2
  const metaPairs: [string, string][] = [
    ['Học phần', config.courseInfo.tenHp],
    ['Mã HP', config.courseInfo.maHp],
    ['Lớp', options.lop ?? ''],
    ['Giảng viên', options.giangVien ?? ''],
    ['Học kỳ', options.hocKy ?? ''],
    ['Năm học', options.namHoc ?? '']
  ]
  let col = 1
  for (const [label, value] of metaPairs) {
    ws.getCell(metaRow, col).value = label
    styleCell(ws.getCell(metaRow, col), { bold: true })
    ws.getCell(metaRow, col + 1).value = value
    styleCell(ws.getCell(metaRow, col + 1))
    col += 2
    if (col > colCount - 1) break
  }

  // Header bảng
  const headerRow = 4
  const headers = [
    'TT',
    'Mã SV',
    'Họ',
    'Tên',
    'Ngày sinh',
    ...sessions.map((s) => s.label),
    ...scoreColumns,
    'Ghi chú'
  ]
  headers.forEach((h, idx) => {
    ws.getCell(headerRow, idx + 1).value = h
  })
  styleHeaderRow(ws, headerRow, colCount)

  // Hàng điểm tối đa
  const maxRow = headerRow + 1
  ws.getCell(maxRow, 1).value = 'Điểm tối đa'
  styleCell(ws.getCell(maxRow, 1), { bold: true, align: 'center' })
  sessions.forEach((_, idx) => {
    ws.getCell(maxRow, 5 + 1 + idx).value = ''
  })
  const scoreStart = 5 + sessions.length
  scoreColumns.forEach((maCot, idx) => {
    ws.getCell(maxRow, scoreStart + idx + 1).value = maxScoreByColumn.get(maCot) ?? ''
    styleCell(ws.getCell(maxRow, scoreStart + idx + 1), { bold: true, align: 'center' })
  })
  for (let c = 1; c <= colCount; c++) ws.getRow(maxRow).getCell(c).border = BORDER_THIN

  // Dữ liệu sinh viên
  const students = options.students ?? []
  let rowNumber = maxRow + 1
  for (const [idx, st] of students.entries()) {
    const row = ws.getRow(rowNumber)
    const ho = st.student.ho || ''
    const ten = st.student.ten || ''

    row.getCell(1).value = st.student.tt || idx + 1
    row.getCell(2).value = st.student.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = ho
    row.getCell(4).value = ten
    row.getCell(5).value = st.student.ngaySinh ?? ''

    const symbols = options.attendance?.[st.student.maSv] ?? {}
    sessions.forEach((s, sIdx) => {
      row.getCell(6 + sIdx).value = symbols[s.label] ?? ''
    })
    scoreColumns.forEach((maCot, cIdx) => {
      const value = st.scores.diemCacCot[maCot]
      row.getCell(scoreStart + cIdx + 1).value = value === null || value === undefined ? '' : value
      row.getCell(scoreStart + cIdx + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: INPUT_FILL }
      }
    })
    row.getCell(colCount).value = st.scores.ghiChu ?? ''

    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c)
      if (!cell.font) cell.font = { name: 'Times New Roman', size: 11 }
      cell.border = BORDER_THIN
      cell.alignment = { vertical: 'middle', horizontal: c >= 6 ? 'center' : 'left' }
      if (c >= 6 && c < scoreStart) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INPUT_FILL } }
      }
    }
    rowNumber++
  }

  // Ghi chú hướng dẫn
  rowNumber += 1
  const notes = [
    'Ô màu vàng là ô cần nhập. Giữ nguyên tên cột để app đọc đúng.',
    'Điểm danh: X = có mặt, OL = online, M = muộn/về sớm, V-CP = vắng có phép, V = vắng.',
    'Điểm chuyên cần tự tính từ điểm danh. Ô trống = chưa nhập; "VT" = vắng thi.',
    'Chấp nhận cả dấu phẩy (2,5) và dấu chấm (2.5).'
  ]
  for (const note of notes) {
    ws.mergeCells(rowNumber, 1, rowNumber, colCount)
    ws.getCell(rowNumber, 1).value = note
    styleCell(ws.getCell(rowNumber, 1), { size: 10, color: 'FF6B7280' })
    rowNumber++
  }

  ws.views = [{ state: 'frozen', xSplit: 4, ySplit: headerRow }]
  return wb
}
