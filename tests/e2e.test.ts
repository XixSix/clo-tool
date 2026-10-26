import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import {
  applyAttendance,
  buildFinalGradesWorkbook,
  buildExamAnalysisWorkbook,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  parseCourseConfig,
  parseRawGrades,
  roundHalfUp,
  validateConfig,
  validateRawGrades,
  writeConfigTemplate,
  writeRawGradesTemplate
} from '@core/index'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from './fixtures/mockClass'
import type { CourseConfig, EvaluationResult, RawGradesFile } from '@core/types'

let dir: string
let config: CourseConfig
let rawFile: RawGradesFile
let result: EvaluationResult

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'clo-e2e-'))
  const configPath = join(dir, 'config.xlsx')
  const rawPath = join(dir, 'raw.xlsx')

  const mockConfig = buildMockConfig()
  const { students, attendance } = buildMockClass(32)

  await writeConfigTemplate(configPath, mockConfig)
  await writeRawGradesTemplate(rawPath, mockConfig, {
    students,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })

  const parsedConfig = await parseCourseConfig(configPath)
  config = parsedConfig.config!
  const parsedRaw = await parseRawGrades(rawPath, config)
  const applied = applyAttendance(parsedRaw.file!, config)
  rawFile = applied.file
  result = calculateEvaluation(config, rawFile.students)
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('Pipeline end-to-end: Config + Điểm thô → Kết quả', () => {
  it('đọc và tính đủ 32 sinh viên, không có lỗi dữ liệu', () => {
    expect(result.students).toHaveLength(32)
    expect(validateConfig(config).filter((i) => i.level === 'error')).toHaveLength(0)
    expect(validateRawGrades(config, rawFile).filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('điểm CLO2 của SV đầu tiên khớp công thức QĐ450', () => {
    const st = result.students[0]
    const cc = st.cellScores['CC_CLO2'].score
    const ckCell = st.cellScores['CK_CLO2'].score
    // CLO2 = (5% * CC + 20% * CK) / 25%
    const expectedClo2 = roundHalfUp((5 * cc + 20 * ckCell) / 25, 1)
    expect(st.cloScores.CLO2).toBe(expectedClo2)
    expect(cc).toBeCloseTo(st.cellScores['CC_CLO3'].score, 5) // cùng cột điểm danh
  })

  it('điểm nhóm và điểm học phần khớp công thức 20/30/50', () => {
    const st = result.students[0]
    const { CC, GK, CK } = st.groupScores
    const expected = roundHalfUp(0.2 * CC.score + 0.3 * GK.score + 0.5 * CK.score, 1)
    expect(st.courseScoreQd450).toBe(expected)
    expect(st.courseScore).toBe(expected)

    const expectedCc = roundHalfUp(
      (CC.cloScores.CLO2 + CC.cloScores.CLO3 + CC.cloScores.CLO5) / 3,
      1
    )
    expect(CC.score).toBe(expectedCc)
  })

  it('TBC CLO là trung bình cộng các CLO đã làm tròn', () => {
    const st = result.students[0]
    const expected = roundHalfUp(
      (st.cloScores.CLO2 + st.cloScores.CLO3 + st.cloScores.CLO4 + st.cloScores.CLO5) / 4,
      1
    )
    expect(st.tbcClo).toBe(expected)
    expect(st.tbcCloInWords.length).toBeGreaterThan(0)
  })

  it('SV vắng thi bị 0 điểm cuối kỳ và đánh dấu isAbsentFinal', () => {
    const st = result.students[4]
    expect(st.isAbsentFinal).toBe(true)
    expect(st.finalCloScores.CLO2).toBe(0)
    // CLO2 = 5% CC + 20% CK(0) trên tổng 25%
    const expected = roundHalfUp((5 * st.cellScores['CC_CLO2'].score) / 25, 1)
    expect(st.cloScores.CLO2).toBe(expected)
  })

  it('SV thiếu dữ liệu được gắn cờ và có cảnh báo', () => {
    const st = result.students[6]
    expect(st.hasMissingData).toBe(true)
    expect(st.warnings.length).toBeGreaterThan(0)
  })

  it('thống kê lớp có đủ CLO và PLO', () => {
    expect(Object.keys(result.summary.cloStats)).toEqual(['CLO2', 'CLO3', 'CLO4', 'CLO5'])
    expect(Object.keys(result.summary.ploStats)).toEqual(['PLO2', 'PLO3', 'PLO4'])
    expect(result.summary.totalStudents).toBe(32)
    expect(result.summary.absentStudents).toBe(1)
  })
})

describe('Psychometrics theo từng đợt và mã đề', () => {
  it('tách đúng các đợt thi / đề, bỏ qua nhóm CC', () => {
    const exams = calculateAllExamPsychometrics(config, rawFile.students)
    // 3 bài thi: GK đề TN (GKT/D1), GK đề TL (GTX/D2), CK đề TL (CK/D3)
    expect(exams.map((e) => e.maDauDiem).sort()).toEqual(['CK', 'GKT', 'GTX'])

    const ck = exams.find((e) => e.maDauDiem === 'CK')!
    expect(ck.maDe).toBe('D3')
    expect(ck.soSinhVien).toBe(30) // lớp 32 SV: loại SV vắng thi (SV4) và SV trống toàn bộ (SV7)
    expect(ck.soCauHoi).toBe(4)
    expect(ck.cronbachAlpha).toBeGreaterThanOrEqual(0)
    expect(ck.cronbachAlpha).toBeLessThanOrEqual(1)
    expect(ck.items).toHaveLength(4)
    for (const item of ck.items) {
      expect(item.doKhoP).toBeGreaterThanOrEqual(0)
      expect(item.doKhoP).toBeLessThanOrEqual(1)
    }

    // Đề GK TN (GKT/D1) có 2 câu cùng đo CLO3
    const gkt = exams.find((e) => e.maDauDiem === 'GKT')!
    expect(gkt.maDe).toBe('D1')
    expect(gkt.soCauHoi).toBe(2)
    expect(gkt.items.map((i) => i.cau)).toEqual(['Câu 1', 'Câu 2'])
    expect(gkt.items.map((i) => i.diemToiDa)).toEqual([6, 4])
  })
})

describe('Xuất Excel', () => {
  it('báo cáo điểm có đủ sheet và dữ liệu đúng', async () => {
    const wb = buildFinalGradesWorkbook(config, result, {
      phase: 'both',
      rawFile,
      context: { hocKy: 'HK1', namHoc: '2026-2027', lop: '1A11_CNTT14', diaDanh: 'Hải Phòng' }
    })
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      'BANG_DIEM_QUA_TRINH',
      'BANG_DIEM_CUOI_KY',
      'BANG_DIEM_HOC_VU',
      'CHI_TIET_CLO',
      'TONG_HOP_LO',
      'CANH_BAO'
    ])
    // Có 2 ảnh biểu đồ (CLO + PLO)
    expect((wb as unknown as { media: unknown[] }).media.length).toBe(2)

    const buffer = await wb.xlsx.writeBuffer()
    const reloaded = new ExcelJS.Workbook()
    await reloaded.xlsx.load(buffer as Buffer)

    const processSheet = reloaded.getWorksheet('BANG_DIEM_QUA_TRINH')!
    expect(processSheet.getCell(14, 2).text).toBe('0123456789')
    expect(Number(processSheet.getCell(14, 6).value)).toBe(result.students[0].processCloScores.CLO2)
    expect(processSheet.getCell(14, 10).text.length).toBeGreaterThan(0) // TBC bằng chữ

    const finalSheet = reloaded.getWorksheet('BANG_DIEM_CUOI_KY')!
    expect(Number(finalSheet.getCell(14, 6).value)).toBe(result.students[0].finalCloScores.CLO2)

    const detail = reloaded.getWorksheet('CHI_TIET_CLO')!
    expect(detail.getCell(1, 4).text).toBe('CC – CLO2')
  })

  it('báo cáo đề thi có đủ 3 sheet', async () => {
    const exams = calculateAllExamPsychometrics(config, rawFile.students)
    const wb = buildExamAnalysisWorkbook(config, exams)
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      'P_D_TUNG_CAU',
      'DO_TIN_CAY',
      'GOI_Y_CAI_TIEN'
    ])
    const buffer = await wb.xlsx.writeBuffer()
    expect(buffer.byteLength).toBeGreaterThan(1000)
  })
})
