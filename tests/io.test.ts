import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import {
  applyAttendance,
  CONFIG_SHEET_COLUMNS,
  matchHeaders,
  normalizeHeader,
  parseCourseConfig,
  parseRawGrades,
  validateConfig,
  validateRawGrades,
  writeConfigTemplate,
  writeRawGradesTemplate
} from '@core/index'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from './fixtures/mockClass'

let dir: string
let configPath: string
let rawPath: string

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'clo-io-'))
  configPath = join(dir, 'config.xlsx')
  rawPath = join(dir, 'raw.xlsx')
  await writeConfigTemplate(configPath, buildMockConfig())
  const { students, attendance } = buildMockClass(10)
  await writeRawGradesTemplate(rawPath, buildMockConfig(), {
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

describe('parseCourseConfig', () => {
  it('đọc Config và dùng mặc định cho điểm danh, quy tắc', async () => {
    const config = await parseCourseConfig(configPath)
    expect(config.courseInfo.maHp).toBe('KTLT101')
    expect(config.cloList.map((c) => c.maClo)).toEqual(['CLO1', 'CLO2', 'CLO3', 'CLO4', 'CLO5'])
    expect(config.keHoachDanhGia).toHaveLength(11)
    expect(config.cauHoi).toHaveLength(50)
    expect(config.maTranPlo).toHaveLength(5)
    expect(config.diemDanh).toHaveLength(5)
    expect(config.quyTac.nguong_dat_clo).toBe(4)
    expect(config.quyTac.rounding_mode).toBe('chain')
  })

  it('báo lỗi rõ ràng khi thiếu sheet bắt buộc', async () => {
    const wb = new ExcelJS.Workbook()
    wb.addWorksheet('HOC_PHAN').addRow(['Ma_HP', 'Ten_HP'])
    const broken = join(dir, 'broken.xlsx')
    await wb.xlsx.writeFile(broken)

    await expect(parseCourseConfig(broken)).rejects.toThrow('Thiếu cột')
  })

  it('không đọc cấu hình điểm danh và quy tắc từ Excel', async () => {
    const config = await parseCourseConfig(configPath)
    expect(config.quyTac.nguong_dat_clo).toBe(4)
    expect(config.quyTac.rounding_mode).toBe('chain')
  })

  it('tự động chia đều trọng số khi ô Trong_So_Phan_Tram bị merge trong KE_HOACH_DANH_GIA', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(configPath)
    const ws = wb.getWorksheet('KE_HOACH_DANH_GIA')!
    // Dòng 2 và 3 merge cột E (Trong_So_Phan_Tram) với giá trị 20%
    ws.mergeCells('E2:E3')
    ws.getCell('E2').value = 20
    const mergedConfigPath = join(dir, 'config-merged-kehoach.xlsx')
    await wb.xlsx.writeFile(mergedConfigPath)

    const parsed = await parseCourseConfig(mergedConfigPath)
    // Dòng 2 và 3 mỗi dòng nhận 20 / 2 = 10%
    expect(parsed.keHoachDanhGia[0].trongSoPhanTram).toBe(10)
    expect(parsed.keHoachDanhGia[1].trongSoPhanTram).toBe(10)
  })
})

describe('parseRawGrades', () => {
  it('đọc sinh viên, giữ Mã SV dạng văn bản và nhận diện VT / ô trống', async () => {
    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(rawPath, config)
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
    // Cột CC = 5 cột cố định + 12 buổi + 1 (không còn cột TD)
    ws.getRow(7).getCell(18).value = '8,5'
    const commaFile = join(dir, 'raw-comma.xlsx')
    await wb.xlsx.writeFile(commaFile)

    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(commaFile, config)
    expect(file.students[1].scores.diemCacCot.CC).toBe(8.5)
  })

  it('nhận diện 3 định dạng cột điểm danh hợp lệ và từ chối định dạng sai', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(4).getCell(6).value = 'Buổi 1 (28/10)'
    ws.getRow(4).getCell(7).value = '29/10'
    const validAttendanceFile = join(dir, 'raw-attendance-valid.xlsx')
    await wb.xlsx.writeFile(validAttendanceFile)

    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(validAttendanceFile, config)
    expect(file.attendanceSessions[0].label).toBe('Buổi 1 (28/10)')
    expect(file.attendanceSessions[1].label).toBe('29/10')

    // Thử định dạng không hợp lệ như "Tiết 1" -> ném RawGradesParseError
    ws.getRow(4).getCell(6).value = 'Tiết 1'
    const invalidAttendanceFile = join(dir, 'raw-attendance-invalid.xlsx')
    await wb.xlsx.writeFile(invalidAttendanceFile)
    await expect(parseRawGrades(invalidAttendanceFile, config)).rejects.toThrow(
      /không đúng định dạng/
    )
  })

  it('báo thiếu cột điểm khai báo trong Config', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    // Cột CC nằm ngay sau 5 cột cố định + 12 cột điểm danh
    ws.getRow(4).getCell(18).value = 'ZZZ_KHONG_CO'
    const missingFile = join(dir, 'raw-missing-column.xlsx')
    await wb.xlsx.writeFile(missingFile)

    const config = await parseCourseConfig(configPath)
    await expect(parseRawGrades(missingFile, config)).rejects.toThrow(
      'Thiếu cột "CC" trong sheet NHAP_LIEU.'
    )
  })

  it('ném lỗi khi ô điểm không phải số', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(rawPath)
    const ws = wb.getWorksheet('NHAP_LIEU')!
    ws.getRow(6).getCell(18).value = 'abc'
    const invalidFile = join(dir, 'raw-invalid-cell.xlsx')
    await wb.xlsx.writeFile(invalidFile)

    const config = await parseCourseConfig(configPath)
    await expect(parseRawGrades(invalidFile, config)).rejects.toThrow(
      'Giá trị "abc" không phải là điểm số hợp lệ'
    )
  })
})

describe('validator', () => {
  it('Config mẫu không có lỗi', async () => {
    const config = await parseCourseConfig(configPath)
    const issues = validateConfig(config)
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('phát hiện tổng trọng số ≠ 100%', () => {
    const config = buildMockConfig()
    config.keHoachDanhGia[0].trongSoPhanTram = 7
    const issues = validateConfig(config)
    expect(issues.some((i) => i.level === 'error' && i.message.includes('100%'))).toBe(true)
  })

  it('phát hiện CLO không tồn tại và cặp đầu điểm–CLO lệch', () => {
    const config = buildMockConfig()
    config.cauHoi[0].clo = 'CLO_KHONG_TON_TAI'
    const issues = validateConfig(config)
    expect(issues.some((i) => i.message.includes('CLO_KHONG_TON_TAI'))).toBe(true)
  })

  it('phát hiện điểm vượt điểm tối đa và báo đúng dòng Excel', async () => {
    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(rawPath, config)
    file.students[0].scores.diemCacCot.CK_C2 = 9
    const issues = validateRawGrades(config, file)
    const issue = issues.find((i) => i.level === 'error' && i.message.includes('> điểm tối đa'))
    expect(issue).toBeDefined()
    expect(issue!.row).toBe(file.studentExcelRows?.[0])
  })

  it('không báo thiếu điểm CC sau khi đã tính từ điểm danh', async () => {
    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(rawPath, config)
    const applied = applyAttendance(file, config)
    const issues = validateRawGrades(config, applied.file)
    expect(issues.some((i) => i.message.includes('chưa nhập điểm cột "CC"'))).toBe(false)
  })

  it('phát hiện mã SV trùng/thiếu và thiếu họ tên', async () => {
    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(rawPath, config)
    file.students[1].student.maSv = file.students[0].student.maSv
    file.students[2].student.maSv = '__MISSING_999'
    file.students[3].student.hoTen = ''

    const messages = validateRawGrades(config, file).map((issue) => issue.message)
    expect(messages).toContain(`Mã SV "${file.students[0].student.maSv}" bị trùng.`)
    expect(messages).toContain('Thiếu Mã SV.')
    expect(messages).toContain('Thiếu họ tên.')
  })

  it('cảnh báo điểm không phải bội của 0,25', async () => {
    const config = await parseCourseConfig(configPath)
    const file = await parseRawGrades(rawPath, config)
    file.students[0].scores.diemCacCot.GTX_C1 = 0.3

    const messages = validateRawGrades(config, file).map((issue) => issue.message)
    expect(messages).toContain(`SV ${file.students[0].student.maSv}: điểm 0.3 không phải bội của 0,25.`)
  })

  it('cảnh báo cỡ mẫu nhỏ và thiếu cột điểm danh', async () => {
    const config = await parseCourseConfig(configPath)
    config.quyTac.nguong_co_mau_n = 999
    const parsedFile = await parseRawGrades(rawPath, config)
    const file = { ...parsedFile, attendanceSessions: [] }

    const messages = validateRawGrades(config, file).map((issue) => issue.message)
    expect(messages).toContain('Quy mô lớp N = 10 < 999: các chỉ số p, d, α kém tin cậy.')
    expect(messages).toContain(
      'File điểm thô không có cột điểm danh (Buổi 1..N). Điểm CC phải nhập tay.'
    )
  })
})

describe('CONFIG_SHEET_COLUMNS', () => {
  it('mọi sheet bắt buộc đều có danh sách cột', () => {
    for (const sheet of [
      'HOC_PHAN',
      'CLO_LIST',
      'KE_HOACH_DANH_GIA',
      'CAU_HOI',
      'MA_TRAN_PLO',
      'MA_TRAN_PLO'
    ]) {
      expect(CONFIG_SHEET_COLUMNS[sheet]).toBeDefined()
    }
  })
})
