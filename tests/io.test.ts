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
  it('đọc đủ 7 sheet của file Config mẫu', async () => {
    const parsed = await parseCourseConfig(configPath)
    expect(parsed.hasErrors).toBe(false)
    const config = parsed.config!
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

  it('đọc đúng QUY_TAC do người dùng đổi giá trị', async () => {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(configPath)
    const ws = wb.getWorksheet('QUY_TAC')!
    ws.eachRow((row, idx) => {
      if (idx > 1 && row.getCell(1).value === 'nguong_dat_clo') row.getCell(2).value = '5.5'
      if (idx > 1 && row.getCell(1).value === 'rounding_mode') row.getCell(2).value = 'final_only'
    })
    const changed = join(dir, 'config-changed.xlsx')
    await wb.xlsx.writeFile(changed)

    const parsed = await parseCourseConfig(changed)
    expect(parsed.config!.quyTac.nguong_dat_clo).toBe(5.5)
    expect(parsed.config!.quyTac.rounding_mode).toBe('final_only')
  })
})

describe('parseRawGrades', () => {
  it('đọc sinh viên, giữ Mã SV dạng văn bản và nhận diện VT / ô trống', async () => {
    const parsedConfig = await parseCourseConfig(configPath)
    const parsed = await parseRawGrades(rawPath, parsedConfig.config!)
    expect(parsed.hasErrors).toBe(false)
    const file = parsed.file!
    expect(file.students).toHaveLength(10)
    expect(file.students[0].maSv).toBe('0123456789')
    expect(file.attendanceSessions).toHaveLength(12)
    expect(file.students[4].diemCacCot.CK_C2).toBe('VT')
    expect(file.students[6].diemCacCot.GKT_C07).toBeNull()
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

    const parsedConfig = await parseCourseConfig(configPath)
    const parsed = await parseRawGrades(commaFile, parsedConfig.config!)
    expect(parsed.file!.students[1].diemCacCot.CC).toBe(8.5)
  })
})

describe('validator', () => {
  it('Config mẫu không có lỗi', async () => {
    const parsed = await parseCourseConfig(configPath)
    const issues = validateConfig(parsed.config!)
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

  it('phát hiện điểm vượt điểm tối đa', async () => {
    const parsedConfig = await parseCourseConfig(configPath)
    const parsed = await parseRawGrades(rawPath, parsedConfig.config!)
    parsed.file!.students[0].diemCacCot.CK_C2 = 9
    const issues = validateRawGrades(parsedConfig.config!, parsed.file!)
    expect(issues.some((i) => i.level === 'error' && i.message.includes('> điểm tối đa'))).toBe(
      true
    )
  })

  it('không báo thiếu điểm CC sau khi đã tính từ điểm danh', async () => {
    const parsedConfig = await parseCourseConfig(configPath)
    const parsed = await parseRawGrades(rawPath, parsedConfig.config!)
    const applied = applyAttendance(parsed.file!, parsedConfig.config!)
    const issues = validateRawGrades(parsedConfig.config!, applied.file)
    expect(issues.some((i) => i.message.includes('chưa nhập điểm cột "CC"'))).toBe(false)
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
      'DIEM_DANH',
      'QUY_TAC'
    ]) {
      expect(CONFIG_SHEET_COLUMNS[sheet]).toBeDefined()
    }
  })
})
