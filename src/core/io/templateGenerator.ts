/**
 * Sinh file Excel mẫu từ dữ liệu cấu hình:
 * - Template_Config.xlsx (7 sheet + HUONG_DAN)
 * - Template_DiemTho.xlsx (sheet NHAP_LIEU, đúng cột điểm khai báo trong Config)
 *
 * Nhờ vậy giảng viên chỉ việc dán điểm vào ô vàng, không phải tự tạo cột.
 */

import ExcelJS from 'exceljs'
import type { CourseConfig, RawStudentRow } from '../types'
import { setWidths, styleCell, styleHeaderRow, styleTitle, BORDER_THIN } from '../exporter/style'
import { writeWorkbook } from './excelUtils'

const HEADER_FILL = 'FF1E40AF'
const INPUT_FILL = 'FFFEF9C3'

function header(
  ws: ExcelJS.Worksheet,
  columns: { header: string; key?: string; width: number }[]
): void {
  ws.columns = columns.map((c) => ({ header: c.header, key: c.key ?? c.header, width: c.width }))
  const row = ws.getRow(1)
  row.height = 26
  row.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = BORDER_THIN
  })
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

export function buildConfigWorkbook(config: CourseConfig): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  // 1. HOC_PHAN
  const wsHp = wb.addWorksheet('HOC_PHAN')
  header(wsHp, [
    { header: 'Mã HP', key: 'Ma_HP', width: 16 },
    { header: 'Tên HP', key: 'Ten_HP', width: 34 },
    { header: 'Số tín chỉ', key: 'So_Tin_Chi', width: 14 },
    { header: 'Hình thức thi', key: 'Hinh_Thuc_Thi', width: 20 },
    { header: 'Loại HP', key: 'Loai_HP', width: 16 }
  ])
  wsHp.addRow({
    Ma_HP: config.courseInfo.maHp,
    Ten_HP: config.courseInfo.tenHp,
    So_Tin_Chi: config.courseInfo.soTinChi,
    Hinh_Thuc_Thi: config.courseInfo.hinhThucThi,
    Loai_HP: config.courseInfo.loaiHp
  })

  // 2. CLO_LIST
  const wsClo = wb.addWorksheet('CLO_LIST')
  header(wsClo, [
    { header: 'Mã CLO', key: 'Ma_CLO', width: 14 },
    { header: 'Nội dung', key: 'Noi_Dung', width: 52 },
    { header: 'Bậc năng lực', key: 'Bac_Nang_Luc', width: 16 },
    { header: 'Trọng số CLO', key: 'Trong_So_CLO', width: 16 }
  ])
  config.cloList.forEach((c) =>
    wsClo.addRow({
      Ma_CLO: c.maClo,
      Noi_Dung: c.noiDung,
      Bac_Nang_Luc: c.bacNangLuc,
      Trong_So_CLO: c.trongSoClo ?? 1
    })
  )

  // 3. KE_HOACH_DANH_GIA
  const wsKeHoach = wb.addWorksheet('KE_HOACH_DANH_GIA')
  header(wsKeHoach, [
    { header: 'Nhóm', key: 'Nhom', width: 10 },
    { header: 'Thành phần', key: 'Thanh_Phan', width: 28 },
    { header: 'Mã đầu điểm', key: 'Ma_Dau_Diem', width: 16 },
    { header: 'CLO', key: 'CLO', width: 14 },
    { header: 'Trọng số %', key: 'Trong_So_Phan_Tram', width: 20 },
    { header: 'Hình thức', key: 'Hinh_Thuc', width: 18 },
    { header: 'Thời điểm', key: 'Thoi_Diem', width: 16 }
  ])
  config.keHoachDanhGia.forEach((p) =>
    wsKeHoach.addRow({
      Nhom: p.nhom,
      Thanh_Phan: p.thanhPhan,
      Ma_Dau_Diem: p.maDauDiem,
      CLO: p.clo,
      Trong_So_Phan_Tram: p.trongSoPhanTram,
      Hinh_Thuc: p.hinhThuc ?? '',
      Thoi_Diem: p.thoiDiem ?? ''
    })
  )

  // 4. CAU_HOI
  const wsCauHoi = wb.addWorksheet('CAU_HOI')
  header(wsCauHoi, [
    { header: 'Mã cột điểm', key: 'Ma_Cot_Diem', width: 16 },
    { header: 'Mã đầu điểm', key: 'Ma_Dau_Diem', width: 16 },
    { header: 'Câu', key: 'Cau', width: 14 },
    { header: 'CLO', key: 'CLO', width: 14 },
    { header: 'Điểm tối đa', key: 'Diem_Toi_Da', width: 14 },
    { header: 'Mã đề', key: 'Ma_De', width: 12 },
    { header: 'Loại', key: 'Loai', width: 10 }
  ])
  config.cauHoi.forEach((q) =>
    wsCauHoi.addRow({
      Ma_Cot_Diem: q.maCotDiem,
      Ma_Dau_Diem: q.maDauDiem,
      Cau: q.cau,
      CLO: q.clo,
      Diem_Toi_Da: q.diemToiDa,
      Ma_De: q.maDe ?? 'ALL',
      Loai: q.loai ?? 'TL'
    })
  )

  // 5. MA_TRAN_PLO
  const wsPlo = wb.addWorksheet('MA_TRAN_PLO')
  header(wsPlo, [
    { header: 'PLO', key: 'PLO', width: 14 },
    { header: 'PI', key: 'PI', width: 14 },
    { header: 'CLO', key: 'CLO', width: 14 }
  ])
  config.maTranPlo.forEach((m) => wsPlo.addRow({ PLO: m.plo, PI: m.pi, CLO: m.clo }))

  // 6. DIEM_DANH
  const wsDiemDanh = wb.addWorksheet('DIEM_DANH')
  header(wsDiemDanh, [
    { header: 'Ký hiệu', key: 'Ky_Hieu', width: 14 },
    { header: 'Hệ số', key: 'He_So', width: 12 },
    { header: 'Diễn giải', key: 'Dien_Giai', width: 36 }
  ])
  ;(config.diemDanh ?? []).forEach((d) =>
    wsDiemDanh.addRow({ Ky_Hieu: d.kyHieu, He_So: d.heSo, Dien_Giai: d.dienGiai ?? '' })
  )

  // 7. QUY_TAC
  const wsQuyTac = wb.addWorksheet('QUY_TAC')
  header(wsQuyTac, [
    { header: 'Mã quy tắc', key: 'Ma_Quy_Tac', width: 26 },
    { header: 'Giá trị', key: 'Gia_Tri', width: 18 },
    { header: 'Mô tả', key: 'Mo_Ta', width: 60 }
  ])
  const r = config.quyTac
  const rules: [string, string, string][] = [
    ['hp_method', r.hp_method, 'Cách tính điểm học phần (QD450 / RAW_POINTS)'],
    ['nguong_dat_clo', String(r.nguong_dat_clo), 'Ngưỡng Đạt của CLO (Quyết định #2)'],
    ['nguong_dat_plo', String(r.nguong_dat_plo), 'Ngưỡng Đạt của PLO thành phần'],
    ['nguong_dat_hp', String(r.nguong_dat_hp), 'Ngưỡng Đạt của học phần'],
    ['clo_bo_phan', r.clo_bo_phan, 'mean_of_ratios (TBC tỷ lệ) / ratio_of_sums (tổng d/tổng t)'],
    ['rounding_mode', r.rounding_mode, 'chain (làm tròn từng bước) / final_only'],
    [
      'tinh_sv_vang_thi',
      String(r.tinh_sv_vang_thi),
      'SV vắng thi tính vào mẫu số % đạt (Quyết định #5)'
    ],
    [
      'canh_bao_cc_don_le',
      String(r.canh_bao_cc_don_le),
      'Cảnh báo CLO chỉ đo bằng CC (Quyết định #7)'
    ],
    ['ty_le_nhom_27', String(r.ty_le_nhom_27), 'Tỷ lệ nhóm trên/dưới khi tính độ phân biệt d'],
    ['nguong_co_mau_n', String(r.nguong_co_mau_n), 'Cảnh báo khi cỡ mẫu N nhỏ hơn ngưỡng này'],
    [
      'ty_le_dat_clo_canh_bao',
      String(r.ty_le_dat_clo_canh_bao),
      '% SV đạt CLO dưới ngưỡng này thì tô cảnh báo'
    ]
  ]
  rules.forEach(([key, value, desc]) =>
    wsQuyTac.addRow({ Ma_Quy_Tac: key, Gia_Tri: value, Mo_Ta: desc })
  )

  // 8. HUONG_DAN
  const wsGuide = wb.addWorksheet('HUONG_DAN')
  wsGuide.mergeCells(1, 1, 1, 3)
  wsGuide.getCell(1, 1).value = 'HƯỚNG DẪN ĐIỀN FILE CONFIG HỌC PHẦN'
  styleTitle(wsGuide, 1, 3)
  setWidths(wsGuide, [20, 60, 44])
  const guideHeader = 3
  ;['Sheet', 'Nội dung cần điền', 'Ghi chú'].forEach((h, idx) => {
    wsGuide.getCell(guideHeader, idx + 1).value = h
  })
  styleHeaderRow(wsGuide, guideHeader, 3)
  const guides: [string, string, string][] = [
    [
      'HOC_PHAN',
      'Mã HP, Tên HP, Số tín chỉ, Hình thức thi, Loại HP',
      'Loại HP: thuong (bình thường) / thuc_hanh (thực hành, đồ án)'
    ],
    [
      'CLO_LIST',
      'Danh sách CLO: Mã CLO, Nội dung, Bậc năng lực (dạng 3/6), Trọng số CLO (tùy chọn)',
      'Bỏ trống trọng số = 1 (hoặc điền % nếu là HP thực hành)'
    ],
    [
      'KE_HOACH_DANH_GIA',
      'Mỗi dòng là một cặp (Mã đầu điểm, CLO) + Trọng số %',
      'Tổng Trọng số % của tất cả các dòng phải = 100%'
    ],
    [
      'CAU_HOI',
      'Mỗi cột điểm: Mã cột điểm, Mã đầu điểm, Câu, CLO, Điểm tối đa, Mã đề, Loại',
      'Mã cột điểm là tên cột thực tế trong file điểm thô; một câu đo nhiều CLO thì tách nhiều dòng'
    ],
    ['MA_TRAN_PLO', 'Ánh xạ PLO → PI → CLO', 'CLO không có PLO sẽ bị cảnh báo'],
    ['DIEM_DANH', 'Ký hiệu điểm danh và hệ số quy đổi', 'Mặc định: X=1, OL=1, M=0.5, V-CP=0.5, V=0 (không cần sửa)'],
    ['QUY_TAC', 'Các tham số nghiệp vụ của nhà trường', 'Mặc định chuẩn QĐ 450 (không sửa nếu không có yêu cầu từ P.QLCL)']
  ]
  guides.forEach(([sheet, content, note]) => {
    const row = wsGuide.addRow([sheet, content, note])
    row.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 11 }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = BORDER_THIN
    })
  })

  wb.eachSheet((ws) => {
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          if (!cell.font) cell.font = { name: 'Times New Roman', size: 11 }
          cell.border = cell.border ?? BORDER_THIN
        })
      }
    })
  })

  return wb
}

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
    const nameParts = st.hoTen.trim().split(/\s+/)
    const ten = nameParts.pop() ?? ''
    const ho = nameParts.join(' ')

    row.getCell(1).value = st.tt || idx + 1
    row.getCell(2).value = st.maSv
    row.getCell(2).numFmt = '@'
    row.getCell(3).value = ho
    row.getCell(4).value = ten
    row.getCell(5).value = st.ngaySinh ?? ''

    const symbols = options.attendance?.[st.maSv] ?? {}
    sessions.forEach((s, sIdx) => {
      row.getCell(6 + sIdx).value = symbols[s.label] ?? ''
    })
    scoreColumns.forEach((maCot, cIdx) => {
      const value = st.diemCacCot[maCot]
      row.getCell(scoreStart + cIdx + 1).value = value === null || value === undefined ? '' : value
      row.getCell(scoreStart + cIdx + 1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: INPUT_FILL }
      }
    })
    row.getCell(colCount).value = st.ghiChu ?? ''

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

export async function writeConfigTemplate(filePath: string, config: CourseConfig): Promise<void> {
  await writeWorkbook(buildConfigWorkbook(config), filePath)
}

export async function writeRawGradesTemplate(
  filePath: string,
  config: CourseConfig,
  options: RawTemplateOptions = {}
): Promise<void> {
  await writeWorkbook(buildRawGradesWorkbook(config, options), filePath)
}
