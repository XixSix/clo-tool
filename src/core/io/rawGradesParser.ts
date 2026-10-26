/**
 * Đọc file điểm thô của lớp (.xlsx) → RawGradesFile
 *
 * Hỗ trợ cả:
 * - Template do app sinh ra (sheet NHAP_LIEU, dòng "Điểm tối đa" ngay dưới tiêu đề)
 * - Mẫu Excel 2026 của P.QLCD (sheet NHAP_LIEU_GV, có cột Buổi 1..N + điểm danh)
 *
 * Nguyên tắc:
 * - Dò tiêu đề theo TÊN CỘT, không theo vị trí.
 * - Mã SV luôn đọc dạng văn bản (giữ số 0 đầu).
 * - Chấp nhận "2,5" và "2.5"; ô trống = chưa nhập; "VT" = vắng thi.
 */

import type {
  AttendanceRecord,
  AttendanceSession,
  CourseConfig,
  RawGradesFile,
  RawGradesMeta,
  RawStudentRow,
  ValidationIssue
} from '../types'
import { cellText, findHeaderRow, parseNumber } from '../utils/excel'
import type ExcelJS from 'exceljs'

const BASE_COLUMNS = ['TT', 'Ma_SV', 'Ho', 'Ten', 'Ho_Ten', 'Ngay_Sinh', 'Ma_De', 'Ghi_Chu']

const META_LABELS: { key: keyof RawGradesMeta; patterns: string[] }[] = [
  { key: 'tenHocPhan', patterns: ['hocphan', 'tenhocphan'] },
  { key: 'lop', patterns: ['lop'] },
  { key: 'giangVien', patterns: ['giangvien', 'gv'] },
  { key: 'hocKy', patterns: ['hocky', 'ky'] },
  { key: 'namHoc', patterns: ['namhoc'] }
]

function normalizeKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function isAttendanceHeader(header: string): boolean {
  // "Buổi 1" sau khi bỏ dấu thành "buoi1" (không còn khoảng trắng)
  const normalized = header
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  return /^(buoi|tiet|session|tuan)\d+/.test(normalized)
}

/** Đọc phần thông tin lớp (các ô nhãn phía trên bảng) */
function parseMeta(ws: ExcelJS.Worksheet, headerRow: number): RawGradesMeta {
  const meta: RawGradesMeta = {}
  for (let r = 1; r < headerRow; r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const label = normalizeKey(cellText(ws.getRow(r).getCell(c)))
      if (!label) continue
      const target = META_LABELS.find((m) => m.patterns.includes(label))
      if (!target) continue
      // Giá trị nằm bên phải nhãn (bỏ qua ô trống)
      for (let cc = c + 1; cc <= Math.min(ws.columnCount, c + 4); cc++) {
        const value = cellText(ws.getRow(r).getCell(cc)).trim()
        if (value) {
          if (!meta[target.key]) meta[target.key] = value
          break
        }
      }
    }
  }
  return meta
}

export interface RawGradesParseResult {
  file?: RawGradesFile
  issues: ValidationIssue[]
  hasErrors: boolean
}

export async function parseRawGrades(
  filePath: string,
  config: CourseConfig
): Promise<RawGradesParseResult> {
  const { readWorkbook, findSheet } = await import('../utils/excel')
  const wb = await readWorkbook(filePath)
  const issues: ValidationIssue[] = []

  const ws = findSheet(wb, 'NHAP_LIEU') ?? findSheet(wb, 'NHAP_LIEU_GV') ?? wb.worksheets[0]
  if (!ws) {
    return {
      issues: [{ level: 'error', message: 'File điểm thô không có sheet dữ liệu.' }],
      hasErrors: true
    }
  }

  // Danh sách cột điểm cần có (từ Config)
  const scoreColumns = Array.from(new Set(config.cauHoi.map((q) => q.maCotDiem)))

  const header = findHeaderRow(ws, [...BASE_COLUMNS, ...scoreColumns], 30)
  if (!header) {
    return {
      issues: [
        {
          level: 'error',
          sheet: ws.name,
          message: 'Không tìm thấy hàng tiêu đề (cần có cột "Mã SV", "Họ", "Tên"...).'
        }
      ],
      hasErrors: true
    }
  }

  const headers = header.headers
  const mapping = header.match.mapping
  const colIndex = (name: string): number | undefined => mapping[name]

  const meta = parseMeta(ws, header.rowNumber)

  // Cột điểm danh (Buổi 1..N)
  const attendanceSessions: AttendanceSession[] = []
  const attendanceColumns: { index: number; label: string }[] = []
  headers.forEach((h, idx) => {
    if (isAttendanceHeader(h)) {
      const label = h.trim()
      attendanceSessions.push({ column: label, label })
      attendanceColumns.push({ index: idx, label })
    }
  })

  // Hàng "Điểm tối đa" ngay dưới tiêu đề
  const declaredMaxScores: Record<string, number> = {}
  let firstStudentRow = header.rowNumber + 1
  const possibleMaxRow = ws.getRow(firstStudentRow)
  const maxRowTexts: string[] = []
  for (let c = 1; c <= ws.columnCount; c++) maxRowTexts.push(cellText(possibleMaxRow.getCell(c)))
  const isMaxRow =
    maxRowTexts.some((t) => /tối\s*đa|toi\s*da/i.test(t)) ||
    (maxRowTexts[0]?.trim() === '' &&
      config.cauHoi.every((q) => {
        const idx = colIndex(q.maCotDiem)
        return (
          idx !== undefined && maxRowTexts[idx] !== '' && parseNumber(maxRowTexts[idx]) !== null
        )
      }))

  if (isMaxRow) {
    for (const q of config.cauHoi) {
      const idx = colIndex(q.maCotDiem)
      if (idx === undefined) continue
      const value = parseNumber(maxRowTexts[idx])
      if (value !== null) declaredMaxScores[q.maCotDiem] = value
    }
    firstStudentRow += 1
  }

  // Đọc từng sinh viên
  const students: RawStudentRow[] = []
  const attendance: AttendanceRecord[] = []

  for (let r = firstStudentRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    const maSvCell =
      colIndex('Ma_SV') !== undefined ? row.getCell(colIndex('Ma_SV')! + 1) : undefined
    const maSv = cellText(maSvCell).trim()
    const ho = colIndex('Ho') !== undefined ? cellText(row.getCell(colIndex('Ho')! + 1)).trim() : ''
    const ten =
      colIndex('Ten') !== undefined ? cellText(row.getCell(colIndex('Ten')! + 1)).trim() : ''
    const hoTenFull =
      colIndex('Ho_Ten') !== undefined ? cellText(row.getCell(colIndex('Ho_Ten')! + 1)).trim() : ''
    const hoTen = hoTenFull || [ho, ten].filter(Boolean).join(' ')

    // Dòng ghi chú/hướng dẫn thường là ô gộp: bỏ qua, không coi là sinh viên
    if (maSvCell?.isMerged) continue
    if (!maSv && !hoTen) continue

    const diemCacCot: RawStudentRow['diemCacCot'] = {}
    const invalidCells: { maCot: string; raw: string }[] = []

    for (const maCot of scoreColumns) {
      const idx = colIndex(maCot)
      if (idx === undefined) continue
      const raw = cellText(row.getCell(idx + 1)).trim()
      if (raw === '') {
        diemCacCot[maCot] = null
      } else if (/^vt$/i.test(raw)) {
        diemCacCot[maCot] = 'VT'
      } else {
        const num = parseNumber(raw)
        if (num === null) {
          // Cột điểm nằm trong ô gộp (dòng ghi chú) -> bỏ qua cả dòng
          if (row.getCell(idx + 1).isMerged) {
            invalidCells.length = 0
            diemCacCot[maCot] = null
            break
          }
          invalidCells.push({ maCot, raw })
          diemCacCot[maCot] = null
        } else {
          diemCacCot[maCot] = num
        }
      }
    }

    for (const invalid of invalidCells) {
      issues.push({
        level: 'error',
        sheet: ws.name,
        row: r,
        column: invalid.maCot,
        message: `Giá trị "${invalid.raw}" không phải là điểm số hợp lệ (chỉ nhận số hoặc "VT").`
      })
    }

    students.push({
      tt: parseNumber(cellText(row.getCell((colIndex('TT') ?? 0) + 1))) ?? students.length + 1,
      maSv: maSv || `__MISSING_${r}`,
      hoTen,
      ngaySinh:
        colIndex('Ngay_Sinh') !== undefined
          ? cellText(row.getCell(colIndex('Ngay_Sinh')! + 1)).trim() || undefined
          : undefined,
      maDe:
        colIndex('Ma_De') !== undefined
          ? cellText(row.getCell(colIndex('Ma_De')! + 1)).trim() || undefined
          : undefined,
      diemCacCot,
      ghiChu:
        colIndex('Ghi_Chu') !== undefined
          ? cellText(row.getCell(colIndex('Ghi_Chu')! + 1)).trim() || undefined
          : undefined
    })

    if (attendanceColumns.length > 0) {
      const symbols: Record<string, string> = {}
      for (const att of attendanceColumns) {
        symbols[att.label] = cellText(row.getCell(att.index + 1)).trim()
      }
      attendance.push({ maSv: maSv || `__MISSING_${r}`, symbols })
    }
  }

  // Cột điểm khai báo trong Config nhưng không có trong file
  for (const maCot of scoreColumns) {
    if (colIndex(maCot) === undefined) {
      const suggestion = header.match.suggestions[maCot]
      issues.push({
        level: 'error',
        sheet: ws.name,
        row: header.rowNumber,
        column: maCot,
        message: `Thiếu cột điểm "${maCot}" khai báo trong Config.`,
        suggestion: suggestion ? `Có phải bạn muốn đặt tên là "${suggestion}"?` : undefined
      })
    }
  }

  if (students.length === 0) {
    issues.push({ level: 'error', sheet: ws.name, message: 'Không đọc được sinh viên nào.' })
  }

  return {
    file: { meta, students, attendance, attendanceSessions, declaredMaxScores },
    issues,
    hasErrors: issues.some((i) => i.level === 'error')
  }
}
