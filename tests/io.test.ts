import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import {
  matchHeaders,
  normalizeHeader,
  parseRawGrades,
  validateCourse,
  validateRawGrades,
  writeRawGradesTemplate
} from '@core/index'
import type { Course } from '@core/types'
import { buildMockClass, buildMockCourse, MOCK_SESSION_LABELS } from './fixtures/mockClass'

let dir: string
let rawPath: string
let course: Course

/** Tìm số cột (1-based) theo tiêu đề ở hàng 4 của sheet NHAP_LIEU. */
function columnOf(ws: ExcelJS.Worksheet, header: string): number {
  const row = ws.getRow(4)
  for (let c = 1; c <= ws.columnCount; c++) {
    if (row.getCell(c).value === header) return c
  }
  throw new Error(`Không tìm thấy cột "${header}" trong file mẫu.`)
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'clo-io-'))
  rawPath = join(dir, 'raw.xlsx')
  course = buildMockCourse()
  const { students, attendance } = buildMockClass(10)
  await writeRawGradesTemplate(rawPath, course, {
    students,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('headerMatcher', () => {
  it('chuẩn hoá tiếng Việt và ký tự đặc biệt', () => {
    expect(normalizeHeader('Mã SV')).toBe('masv')
    expect(normalizeHeader('Họ_và_tên')).toBe('hovaten')
  })

  it('dò được cột lệch dấu / khoảng trắng', () => {
    const result = matchHeaders(
      ['TT', 'Mã sinh viên', 'Họ và tên', 'Ngày sinh'],
      ['TT', 'Ma_SV', 'Ho_Ten', 'Ngay_Sinh']
    )
    expect(result.mapping['Ma_SV']).toBe(1)
    expect(result.mapping['Ho_Ten']).toBe(2)
    expect(result.missing).toHaveLength(0)
  })

  it('gợi ý tên gần giống khi lệch nhiều', () => {
    const result = matchHeaders(['Ma Sinh Vjen'], ['Ma_SV'])
    expect(result.suggestions['Ma_SV']).toBe('Ma Sinh Vjen')
  })
})

describe('parseRawGrades', () => {
  it('đọc sinh viên, giữ Mã SV dạng văn bản và nhận diện VT / ô trống', async () => {
    const file = await parseRawGrades(rawPath, course)
    expect(file.students).toHaveLength(10)
    expect(file.students[0].student.maSv).toBe('0123456789')
    expect(file.studentExcelRows?.[0]).toBe(6)
    expect(file.attendanceSessions).toHaveLength(12)
    expect(file.students[4].scores.diemCacCot.CK_C2).toBe('VT')
    expect(file.students[6].scores.diemCacCot.GKT_C07).toBeNull()
    expect(file.meta.lop).toBe('1A11_CNTT14')
    expect(file.declaredMaxScores.GKT_C01).toBe(0.25)
  })

  it('chấp nhận dấu phẩy thập phân', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(7).getCell(columnOf(ws, 'GKT_C01')).value = '0,25'
    const commaFile = join(dir, 'raw-comma.xlsx')
    await wb.xlsx.writeFile(commaFile)

    const file = await parseRawGrades(commaFile, course)
    expect(file.students[1].scores.diemCacCot.GKT_C01).toBe(0.25)
  })

  it('nhận diện 3 định dạng cột điểm danh hợp lệ và từ chối định dạng sai', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(4).getCell(6).value = 'Buổi 1 (28/10)'
    ws.getRow(4).getCell(7).value = '29/10'
    const validAttendanceFile = join(dir, 'raw-attendance-valid.xlsx')
    await wb.xlsx.writeFile(validAttendanceFile)

    const file = await parseRawGrades(validAttendanceFile, course)
    expect(file.attendanceSessions[0].label).toBe('Buổi 1 (28/10)')
    expect(file.attendanceSessions[1].label).toBe('29/10')

    // Thử định dạng không hợp lệ như "Tiết 1" -> ném RawGradesParseError
    ws.getRow(4).getCell(6).value = 'Tiết 1'
    const invalidAttendanceFile = join(dir, 'raw-attendance-invalid.xlsx')
    await wb.xlsx.writeFile(invalidAttendanceFile)
    await expect(parseRawGrades(invalidAttendanceFile, course)).rejects.toThrow(
      /không đúng định dạng/
    )
  })

  it('báo thiếu cột điểm khai báo trong Course', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(4).getCell(columnOf(ws, 'GKT_C01')).value = 'ZZZ_KHONG_CO'
    const missingFile = join(dir, 'raw-missing-column.xlsx')
    await wb.xlsx.writeFile(missingFile)

    await expect(parseRawGrades(missingFile, course)).rejects.toThrow(
      'Thiếu cột điểm "GKT_C01" khai báo trong cấu hình học phần.'
    )
  })

  it('ném lỗi khi ô điểm không phải số', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(6).getCell(columnOf(ws, 'GKT_C01')).value = 'abc'
    const invalidFile = join(dir, 'raw-invalid-cell.xlsx')
    await wb.xlsx.writeFile(invalidFile)

    await expect(parseRawGrades(invalidFile, course)).rejects.toThrow(
      'Giá trị "abc" không phải là điểm số hợp lệ'
    )
  })
})

describe('validator', () => {
  it('Course mẫu không có lỗi', () => {
    const issues = validateCourse(course)
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('phát hiện tổng trọng số ≠ 100%', () => {
    const broken = buildMockCourse()
    broken.dotDanhGia[0].trongSoPhanTram = 7
    const issues = validateCourse(broken)
    expect(issues.some((i) => i.level === 'error' && i.message.includes('100%'))).toBe(true)
  })

  it('phát hiện CLO không tồn tại', () => {
    const broken = buildMockCourse()
    broken.dotDanhGia[0].cloList[0].cloId = 'CLO_KHONG_TON_TAI'
    const issues = validateCourse(broken)
    expect(issues.some((i) => i.message.includes('CLO_KHONG_TON_TAI'))).toBe(true)
  })

  it('phát hiện điểm vượt điểm tối đa và báo đúng dòng Excel', async () => {
    const file = await parseRawGrades(rawPath, course)
    file.students[0].scores.diemCacCot.CK_C2 = 9
    const issues = validateRawGrades(course, file)
    const issue = issues.find(
      (i) => i.level === 'error' && i.message.includes('vượt quá điểm tối đa')
    )
    expect(issue).toBeDefined()
    expect(issue!.row).toBe(file.studentExcelRows?.[0])
  })

  it('phát hiện mã SV trùng/thiếu và thiếu họ tên', async () => {
    const file = await parseRawGrades(rawPath, course)
    file.students[1].student.maSv = file.students[0].student.maSv
    file.students[2].student.maSv = '__MISSING_999'
    file.students[3].student.hoTen = ''

    const messages = validateRawGrades(course, file).map((issue) => issue.message)
    expect(messages).toContain(`Mã SV "${file.students[0].student.maSv}" bị trùng.`)
    expect(messages).toContain('Thiếu Mã SV.')
    expect(messages).toContain('Thiếu họ tên.')
  })

  it('cảnh báo điểm không phải bội của 0,25', async () => {
    const file = await parseRawGrades(rawPath, course)
    file.students[0].scores.diemCacCot.GTX_C1 = 0.3

    const messages = validateRawGrades(course, file).map((issue) => issue.message)
    expect(messages).toContain(
      `SV ${file.students[0].student.maSv}: điểm "GTX_C1" = 0.3 không phải bội của 0,25.`
    )
  })

  it('cảnh báo cỡ mẫu nhỏ và thiếu cột điểm danh', async () => {
    const broken = buildMockCourse()
    broken.quyTac.nguongCoMauN = 999
    const parsedFile = await parseRawGrades(rawPath, broken)
    const file = { ...parsedFile, attendanceSessions: [] }

    const messages = validateRawGrades(broken, file).map((issue) => issue.message)
    expect(messages).toContain('Quy mô lớp N = 10 < 999: các chỉ số p, d, α kém tin cậy.')
    expect(messages).toContain(
      'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    )
  })
})
