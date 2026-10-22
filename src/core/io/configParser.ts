/**
 * Đọc file Config học phần (.xlsx) → CourseConfig
 *
 * - Dò tiêu đề theo TÊN CỘT (không theo vị trí cố định).
 * - Tên cột có thể lệch dấu/khoảng trắng/hoa thường; nếu lệch nhiều sẽ gợi ý.
 * - Sheet QUY_TAC được merge với DEFAULT_BUSINESS_RULES: thiếu khoá nào dùng mặc định khoá đó.
 */

import type {
  AttendanceRule,
  BusinessRules,
  CLODefinition,
  CourseConfig,
  CourseInfo,
  EvaluationPlanItem,
  PLOMapping,
  QuestionColumn,
  ValidationIssue
} from '../types'
import { DEFAULT_BUSINESS_RULES } from '../rules'
import { parseBoolean, parseNumber } from './excelUtils'
import { cellText, findHeaderRow, findSheet, rowTexts } from './excelUtils'
import type ExcelJS from 'exceljs'

export interface ConfigParseResult {
  config?: CourseConfig
  issues: ValidationIssue[]
  hasErrors: boolean
}

/** Tên cột chuẩn của từng sheet (dùng để dò tiêu đề) */
export const CONFIG_SHEET_COLUMNS: Record<string, string[]> = {
  HOC_PHAN: ['Ma_HP', 'Ten_HP', 'So_Tin_Chi', 'Hinh_Thuc_Thi', 'Loai_HP'],
  CLO_LIST: ['Ma_CLO', 'Noi_Dung', 'Bac_Nang_Luc', 'Trong_So_CLO'],
  KE_HOACH_DANH_GIA: [
    'Nhom',
    'Thanh_Phan',
    'Ma_Dau_Diem',
    'CLO',
    'Trong_So_Phan_Tram',
    'Hinh_Thuc',
    'Thoi_Diem'
  ],
  CAU_HOI: ['Ma_Cot_Diem', 'Ma_Dau_Diem', 'Cau', 'CLO', 'Diem_Toi_Da', 'Ma_De', 'Loai'],
  MA_TRAN_PLO: ['PLO', 'PI', 'CLO'],
  DIEM_DANH: ['Ky_Hieu', 'He_So', 'Dien_Giai'],
  QUY_TAC: ['Ma_Quy_Tac', 'Gia_Tri']
}

function get(
  ws: ExcelJS.Worksheet,
  rowNumber: number,
  headers: Record<string, number>,
  column: string
): string {
  const idx = headers[column]
  if (idx === undefined) return ''
  return cellText(ws.getRow(rowNumber).getCell(idx + 1))
}

/**
 * Đọc một sheet dạng bảng: trả về header map + danh sách dòng dữ liệu không rỗng.
 */
function readTable(
  ws: ExcelJS.Worksheet,
  columns: string[],
  sheetName: string,
  issues: ValidationIssue[]
): { headers: Record<string, number>; rows: number[] } {
  const header = findHeaderRow(ws, columns)
  if (!header) {
    issues.push({
      level: 'error',
      sheet: sheetName,
      message: `Không tìm thấy hàng tiêu đề của sheet ${sheetName}.`,
      suggestion: `Cần tối thiểu các cột: ${columns.join(', ')}`
    })
    return { headers: {}, rows: [] }
  }

  for (const missing of header.match.missing) {
    issues.push({
      level: 'error',
      sheet: sheetName,
      row: header.rowNumber,
      column: missing,
      message: `Thiếu cột "${missing}" trong sheet ${sheetName}.`,
      suggestion: header.match.suggestions[missing]
        ? `Có phải bạn muốn đặt tên là "${header.match.suggestions[missing]}"?`
        : undefined
    })
  }

  const rows: number[] = []
  for (let r = header.rowNumber + 1; r <= ws.rowCount; r++) {
    const texts = rowTexts(ws.getRow(r), ws.columnCount)
    if (texts.some((t) => t.trim() !== '')) rows.push(r)
  }

  return { headers: header.match.mapping, rows }
}

function parseBusinessRules(
  ws: ExcelJS.Worksheet,
  headers: Record<string, number>,
  rows: number[],
  issues: ValidationIssue[]
): BusinessRules {
  const rules: BusinessRules = { ...DEFAULT_BUSINESS_RULES }

  for (const r of rows) {
    const key = get(ws, r, headers, 'Ma_Quy_Tac')
    const rawValue = get(ws, r, headers, 'Gia_Tri')
    if (!key) continue

    switch (key) {
      case 'hp_method':
        if (rawValue === 'QD450' || rawValue === 'RAW_POINTS') rules.hp_method = rawValue
        break
      case 'rounding_mode':
        if (rawValue === 'chain' || rawValue === 'final_only') rules.rounding_mode = rawValue
        break
      case 'clo_bo_phan':
        if (rawValue === 'mean_of_ratios' || rawValue === 'ratio_of_sums') {
          rules.clo_bo_phan = rawValue
        }
        break
      case 'nguong_dat_clo':
        rules.nguong_dat_clo = parseNumber(rawValue) ?? rules.nguong_dat_clo
        break
      case 'nguong_dat_plo':
        rules.nguong_dat_plo = parseNumber(rawValue) ?? rules.nguong_dat_plo
        break
      case 'nguong_dat_hp':
        rules.nguong_dat_hp = parseNumber(rawValue) ?? rules.nguong_dat_hp
        break
      case 'ty_le_nhom_27':
        rules.ty_le_nhom_27 = parseNumber(rawValue) ?? rules.ty_le_nhom_27
        break
      case 'nguong_co_mau_n':
        rules.nguong_co_mau_n = parseNumber(rawValue) ?? rules.nguong_co_mau_n
        break
      case 'tinh_sv_vang_thi':
        rules.tinh_sv_vang_thi = parseBoolean(rawValue, rules.tinh_sv_vang_thi)
        break
      case 'canh_bao_cc_don_le':
        rules.canh_bao_cc_don_le = parseBoolean(rawValue, rules.canh_bao_cc_don_le)
        break
      case 'ty_le_dat_clo_canh_bao':
        rules.ty_le_dat_clo_canh_bao = parseNumber(rawValue) ?? rules.ty_le_dat_clo_canh_bao
        break
      default:
        issues.push({
          level: 'warning',
          sheet: ws.name,
          row: r,
          column: 'Ma_Quy_Tac',
          message: `Quy tắc "${key}" không được hỗ trợ, đã bỏ qua.`
        })
    }
  }

  return rules
}

export async function parseCourseConfig(filePath: string): Promise<ConfigParseResult> {
  const { readWorkbook } = await import('./excelUtils')
  const wb = await readWorkbook(filePath)
  const issues: ValidationIssue[] = []

  const sheetOf = (name: string): ExcelJS.Worksheet | undefined => findSheet(wb, name)

  // 1. HOC_PHAN
  const wsHp = sheetOf('HOC_PHAN')
  let courseInfo: CourseInfo = {
    maHp: '',
    tenHp: '',
    soTinChi: 0,
    hinhThucThi: '',
    loaiHp: 'thuong'
  }
  if (!wsHp) {
    issues.push({ level: 'error', message: 'Thiếu sheet HOC_PHAN trong file Config.' })
  } else {
    const { headers, rows } = readTable(wsHp, CONFIG_SHEET_COLUMNS.HOC_PHAN, 'HOC_PHAN', issues)
    const r = rows[0]
    if (r === undefined) {
      issues.push({
        level: 'error',
        sheet: 'HOC_PHAN',
        message: 'Sheet HOC_PHAN không có dữ liệu.'
      })
    } else {
      courseInfo = {
        maHp: get(wsHp, r, headers, 'Ma_HP'),
        tenHp: get(wsHp, r, headers, 'Ten_HP'),
        soTinChi: parseNumber(get(wsHp, r, headers, 'So_Tin_Chi')) ?? 0,
        hinhThucThi: get(wsHp, r, headers, 'Hinh_Thuc_Thi'),
        loaiHp: get(wsHp, r, headers, 'Loai_HP') === 'thuc_hanh' ? 'thuc_hanh' : 'thuong'
      }
    }
  }

  // 2. CLO_LIST
  const cloList: CLODefinition[] = []
  const wsClo = sheetOf('CLO_LIST')
  if (!wsClo) {
    issues.push({ level: 'error', message: 'Thiếu sheet CLO_LIST trong file Config.' })
  } else {
    const { headers, rows } = readTable(wsClo, CONFIG_SHEET_COLUMNS.CLO_LIST, 'CLO_LIST', issues)
    for (const r of rows) {
      const maClo = get(wsClo, r, headers, 'Ma_CLO')
      if (!maClo) continue
      cloList.push({
        maClo,
        noiDung: get(wsClo, r, headers, 'Noi_Dung'),
        bacNangLuc: get(wsClo, r, headers, 'Bac_Nang_Luc'),
        trongSoClo: parseNumber(get(wsClo, r, headers, 'Trong_So_CLO')) ?? undefined
      })
    }
  }

  // 3. KE_HOACH_DANH_GIA
  const keHoachDanhGia: EvaluationPlanItem[] = []
  const wsKeHoach = sheetOf('KE_HOACH_DANH_GIA')
  if (!wsKeHoach) {
    issues.push({ level: 'error', message: 'Thiếu sheet KE_HOACH_DANH_GIA trong file Config.' })
  } else {
    const { headers, rows } = readTable(
      wsKeHoach,
      CONFIG_SHEET_COLUMNS.KE_HOACH_DANH_GIA,
      'KE_HOACH_DANH_GIA',
      issues
    )
    for (const r of rows) {
      const nhomRaw = get(wsKeHoach, r, headers, 'Nhom').toUpperCase()
      const maDauDiem = get(wsKeHoach, r, headers, 'Ma_Dau_Diem')
      const clo = get(wsKeHoach, r, headers, 'CLO')
      const trongSo = parseNumber(get(wsKeHoach, r, headers, 'Trong_So_Phan_Tram'))
      if (!maDauDiem && !clo) continue
      if (!['CC', 'GK', 'CK'].includes(nhomRaw)) {
        issues.push({
          level: 'error',
          sheet: 'KE_HOACH_DANH_GIA',
          row: r,
          column: 'Nhom',
          message: `Nhóm "${nhomRaw}" không hợp lệ (chỉ nhận CC, GK, CK).`
        })
        continue
      }
      keHoachDanhGia.push({
        nhom: nhomRaw as 'CC' | 'GK' | 'CK',
        thanhPhan: get(wsKeHoach, r, headers, 'Thanh_Phan'),
        maDauDiem,
        clo,
        trongSoPhanTram: trongSo ?? 0,
        hinhThuc: get(wsKeHoach, r, headers, 'Hinh_Thuc') || undefined,
        thoiDiem: get(wsKeHoach, r, headers, 'Thoi_Diem') || undefined
      })
    }
  }

  // 4. CAU_HOI
  const cauHoi: QuestionColumn[] = []
  const wsCauHoi = sheetOf('CAU_HOI')
  if (!wsCauHoi) {
    issues.push({ level: 'error', message: 'Thiếu sheet CAU_HOI trong file Config.' })
  } else {
    const { headers, rows } = readTable(wsCauHoi, CONFIG_SHEET_COLUMNS.CAU_HOI, 'CAU_HOI', issues)
    for (const r of rows) {
      const maCotDiem = get(wsCauHoi, r, headers, 'Ma_Cot_Diem')
      const maDauDiem = get(wsCauHoi, r, headers, 'Ma_Dau_Diem')
      if (!maCotDiem && !maDauDiem) continue
      const loaiRaw = get(wsCauHoi, r, headers, 'Loai').toUpperCase()
      cauHoi.push({
        maCotDiem,
        maDauDiem,
        cau: get(wsCauHoi, r, headers, 'Cau'),
        clo: get(wsCauHoi, r, headers, 'CLO'),
        diemToiDa: parseNumber(get(wsCauHoi, r, headers, 'Diem_Toi_Da')) ?? 0,
        maDe: get(wsCauHoi, r, headers, 'Ma_De') || 'ALL',
        loai: loaiRaw === 'TN' ? 'TN' : loaiRaw === 'TL' ? 'TL' : undefined
      })
    }
  }

  // 5. MA_TRAN_PLO
  const maTranPlo: PLOMapping[] = []
  const wsPlo = sheetOf('MA_TRAN_PLO')
  if (wsPlo) {
    const { headers, rows } = readTable(
      wsPlo,
      CONFIG_SHEET_COLUMNS.MA_TRAN_PLO,
      'MA_TRAN_PLO',
      issues
    )
    for (const r of rows) {
      const plo = get(wsPlo, r, headers, 'PLO')
      const clo = get(wsPlo, r, headers, 'CLO')
      if (!plo || !clo) continue
      maTranPlo.push({ plo, pi: get(wsPlo, r, headers, 'PI'), clo })
    }
  }

  // 6. DIEM_DANH
  let diemDanh: AttendanceRule[] | undefined
  const wsDiemDanh = sheetOf('DIEM_DANH')
  if (wsDiemDanh) {
    const { headers, rows } = readTable(
      wsDiemDanh,
      CONFIG_SHEET_COLUMNS.DIEM_DANH,
      'DIEM_DANH',
      issues
    )
    const parsed: AttendanceRule[] = []
    for (const r of rows) {
      const kyHieu = get(wsDiemDanh, r, headers, 'Ky_Hieu')
      if (!kyHieu) continue
      parsed.push({
        kyHieu,
        heSo: parseNumber(get(wsDiemDanh, r, headers, 'He_So')) ?? 0,
        dienGiai: get(wsDiemDanh, r, headers, 'Dien_Giai') || undefined
      })
    }
    if (parsed.length > 0) diemDanh = parsed
  }

  // 7. QUY_TAC
  let quyTac: BusinessRules = { ...DEFAULT_BUSINESS_RULES }
  const wsQuyTac = sheetOf('QUY_TAC')
  if (wsQuyTac) {
    const { headers, rows } = readTable(wsQuyTac, CONFIG_SHEET_COLUMNS.QUY_TAC, 'QUY_TAC', issues)
    quyTac = parseBusinessRules(wsQuyTac, headers, rows, issues)
  }

  const config: CourseConfig = {
    courseInfo,
    cloList,
    keHoachDanhGia,
    cauHoi,
    maTranPlo,
    diemDanh,
    quyTac
  }

  return {
    config,
    issues,
    hasErrors: issues.some((i) => i.level === 'error')
  }
}
