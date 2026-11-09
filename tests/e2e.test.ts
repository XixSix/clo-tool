import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import {
  buildExamAnalysisWorkbook,
  buildFinalGradesWorkbook,
  buildStudentRecords,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  calculateGroupScores,
  calculatePhaseCloScores,
  parseRawGrades,
  roundHalfUp,
  validateCourse,
  validateRawGrades,
  writeRawGradesTemplate
} from '@core/index'
import { buildMockClass, buildMockCourse, MOCK_SESSION_LABELS } from './fixtures/mockClass'
import type { Course, EvaluationReport, RawGrades, Student, StudentCourseResult } from '@core/types'

let dir: string
let course: Course
let rawFile: RawGrades
let students: Student[]
let result: EvaluationReport

function cellScore(st: StudentCourseResult, dotId: string, cloId: string): number {
  const dot = st.dotDanhGia.find((d) => d.dotDanhGiaId === dotId)
  return dot?.clo.find((c) => c.cloId === cloId)?.diem ?? 0
}

function cloScore(st: StudentCourseResult, cloId: string): number {
  return st.clo.find((c) => c.cloId === cloId)?.diem ?? 0
}

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), 'clo-e2e-'))
  const rawPath = join(dir, 'raw.xlsx')

  course = buildMockCourse()
  const { students: rawStudents, attendance } = buildMockClass(32)

  await writeRawGradesTemplate(rawPath, course, {
    students: rawStudents,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })

  rawFile = await parseRawGrades(rawPath, course)
  const parsed = buildStudentRecords(course, rawFile)
  students = parsed.students
  result = calculateEvaluation(course, students, parsed.records)
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('Pipeline end-to-end: Course + Điểm thô → Kết quả', () => {
  it('đọc và tính đủ 32 sinh viên, không có lỗi dữ liệu', () => {
    expect(result.sinhVien).toHaveLength(32)
    expect(validateCourse(course).filter((i) => i.level === 'error')).toHaveLength(0)
    expect(validateRawGrades(course, rawFile).filter((i) => i.level === 'error')).toHaveLength(0)
  })

  it('điểm CLO2 của SV đầu tiên khớp công thức QĐ450', () => {
    const st = result.sinhVien[0]
    const gktCell = cellScore(st, 'GKT', 'CLO2')
    const gtxCell = cellScore(st, 'GTX', 'CLO2')
    const ckCell = cellScore(st, 'CK', 'CLO2')
    // CLO2 = (6% * GKT TN + 4% * GTX TL + 10% * CK) / 20%
    const expectedClo2 = roundHalfUp((6 * gktCell + 4 * gtxCell + 10 * ckCell) / 20, 1)
    expect(cloScore(st, 'CLO2')).toBe(expectedClo2)
    // CLO1 chỉ được đo bằng chuyên cần (từ điểm danh)
    expect(cellScore(st, 'CC', 'CLO1')).toBeGreaterThan(0)
  })

  it('điểm nhóm và điểm học phần khớp công thức 20/30/50', () => {
    const st = result.sinhVien[0]
    const { groupScores } = calculateGroupScores(course, st.dotDanhGia)
    const expected = roundHalfUp(
      0.2 * groupScores.CC.score + 0.3 * groupScores.GK.score + 0.5 * groupScores.CK.score,
      1
    )
    expect(st.diemHocPhanQd450).toBe(expected)
    expect(st.diemHocPhan).toBe(expected)

    // Nhóm CC chỉ gồm CLO1
    expect(groupScores.CC.cloCodes).toEqual(['CLO1'])
    expect(groupScores.CC.score).toBe(cloScore(st, 'CLO1'))
  })

  it('TBC CLO là trung bình cộng các CLO đã làm tròn', () => {
    const st = result.sinhVien[0]
    const expected = roundHalfUp(
      ['CLO1', 'CLO2', 'CLO3', 'CLO4', 'CLO5']
        .map((id) => cloScore(st, id))
        .reduce((sum, v) => sum + v, 0) / 5,
      1
    )
    expect(st.tbcClo).toBe(expected)
  })

  it('SV vắng thi bị 0 điểm cuối kỳ và đánh dấu vangThiCuoiKy', () => {
    const st = result.sinhVien[4]
    expect(st.vangThiCuoiKy).toBe(true)
    expect(calculatePhaseCloScores(course, st.dotDanhGia, 'final').CLO2).toBe(0)
    // CLO2 = (6% * GKT + 4% * GTX + 10% * 0) / 20%
    const expected = roundHalfUp(
      (6 * cellScore(st, 'GKT', 'CLO2') + 4 * cellScore(st, 'GTX', 'CLO2')) / 20,
      1
    )
    expect(cloScore(st, 'CLO2')).toBe(expected)
  })

  it('SV thiếu dữ liệu được gắn cờ và có cảnh báo', () => {
    const st = result.sinhVien[6]
    expect(st.thieuDuLieu).toBe(true)
    expect(st.canhBao.length).toBeGreaterThan(0)
  })

  it('câu trống = 0 điểm câu, ô vẫn được tính (Quyết định #9 cấp câu)', () => {
    // SV6: GTX_C4 trống → ô GTX–CLO4 = TB(1,5/2 = 0,75; trống = 0) = 3,75 → 3,8
    const st = result.sinhVien[6]
    expect(cellScore(st, 'GTX', 'CLO4')).toBe(3.8)
    expect(st.thieuDuLieu).toBe(true)

    // GKT–CLO2 của SV6: 10 đúng + 1 sai + 1 trống (GKT_C07) → 10/12 × 10 = 8,3
    expect(cellScore(st, 'GKT', 'CLO2')).toBe(8.3)
  })

  it('thống kê lớp có đủ CLO và PLO', () => {
    expect(result.tongHop.clo.map((c) => c.cloId)).toEqual(['CLO1', 'CLO2', 'CLO3', 'CLO4', 'CLO5'])
    expect(result.tongHop.plo.map((p) => p.ploId)).toEqual(['PLO2', 'PLO3', 'PLO4'])
    expect(result.tongHop.tongSinhVien).toBe(32)
    expect(result.tongHop.soSinhVienVangThi).toBe(1)
  })
})

describe('Psychometrics theo từng đợt và mã đề', () => {
  it('tách đúng các đợt thi / đề, bỏ qua nhóm CC', () => {
    const parsed = buildStudentRecords(course, rawFile)
    const exams = calculateAllExamPsychometrics(course, parsed.students, parsed.records)
    // 3 bài thi: GK đề TN (GKT/D1), GK đề TL (GTX/D2), CK đề TL (CK/D3)
    expect(exams.map((e) => e.maDauDiem).sort()).toEqual(['CK', 'GKT', 'GTX'])

    const ck = exams.find((e) => e.maDauDiem === 'CK')!
    expect(ck.maDe).toBe('D3')
    expect(ck.soSinhVien).toBe(30) // lớp 32 SV: loại SV vắng thi (SV4) và SV trống toàn bộ (SV7)
    expect(ck.soCauHoi).toBe(5)
    expect(ck.cronbachAlpha).toBeGreaterThanOrEqual(0)
    expect(ck.cronbachAlpha).toBeLessThanOrEqual(1)
    expect(ck.items).toHaveLength(5)
    for (const item of ck.items) {
      expect(item.doKhoP).toBeGreaterThanOrEqual(0)
      expect(item.doKhoP).toBeLessThanOrEqual(1)
    }

    // Đề GK TN (GKT/D1): 40 câu × 0,25 điểm, đo CLO2/CLO3/CLO4
    const gkt = exams.find((e) => e.maDauDiem === 'GKT')!
    expect(gkt.maDe).toBe('D1')
    expect(gkt.soCauHoi).toBe(40)
    expect(gkt.items.map((i) => i.cau)[0]).toBe('Câu 1')
    expect(gkt.items.map((i) => i.cau)[39]).toBe('Câu 40')
    expect(new Set(gkt.items.map((i) => i.diemToiDa))).toEqual(new Set([0.25]))

    // Đề GK TL (GTX/D2): 4 câu, 2 câu cùng đo CLO4
    const gtx = exams.find((e) => e.maDauDiem === 'GTX')!
    expect(gtx.maDe).toBe('D2')
    expect(gtx.soCauHoi).toBe(4)
    expect(gtx.items.map((i) => i.diemToiDa)).toEqual([3, 2.5, 2, 2.5])
  })
})

describe('Xuất Excel', () => {
  it('báo cáo điểm có đủ sheet và dữ liệu đúng', async () => {
    const wb = buildFinalGradesWorkbook(course, result, {
      phase: 'both',
      rawFile,
      students,
      issues: validateRawGrades(course, rawFile),
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
    await reloaded.xlsx.load(buffer as unknown as Buffer)

    const st0 = result.sinhVien[0]
    const processClos = calculatePhaseCloScores(course, st0.dotDanhGia, 'process')
    const finalClos = calculatePhaseCloScores(course, st0.dotDanhGia, 'final')

    const processSheet = reloaded.getWorksheet('BANG_DIEM_QUA_TRINH')!
    expect(processSheet.getCell(14, 2).text).toBe('0123456789')
    // Cột 6 = CLO1, cột 7 = CLO2 (CLO bắt đầu sau 5 cột thông tin)
    expect(Number(processSheet.getCell(14, 6).value)).toBe(processClos.CLO1)
    expect(Number(processSheet.getCell(14, 7).value)).toBe(processClos.CLO2)
    expect(processSheet.getCell(14, 10).text.length).toBeGreaterThan(0) // TBC bằng chữ

    const finalSheet = reloaded.getWorksheet('BANG_DIEM_CUOI_KY')!
    // Bản cuối kỳ chỉ có CLO của nhóm CK (CLO2–CLO5): cột 6 = CLO2
    expect(Number(finalSheet.getCell(14, 6).value)).toBe(finalClos.CLO2)

    const detail = reloaded.getWorksheet('CHI_TIET_CLO')!
    expect(detail.getCell(1, 4).text).toBe('CC – CLO1')
  })

  it('báo cáo đề thi có đủ 3 sheet', async () => {
    const parsed = buildStudentRecords(course, rawFile)
    const exams = calculateAllExamPsychometrics(course, parsed.students, parsed.records)
    const wb = buildExamAnalysisWorkbook(course, exams)
    expect(wb.worksheets.map((ws) => ws.name)).toEqual([
      'P_D_TUNG_CAU',
      'DO_TIN_CAY',
      'GOI_Y_CAI_TIEN'
    ])
    const buffer = await wb.xlsx.writeBuffer()
    expect(buffer.byteLength).toBeGreaterThan(1000)
  })
})
