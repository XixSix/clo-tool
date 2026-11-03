/** Sinh Template_Config.xlsx. */

import ExcelJS from 'exceljs'
import type { CourseConfig } from '../types'
import { setWidths, styleHeaderRow, styleTitle, BORDER_THIN } from '../exporter/style'

const HEADER_FILL = 'FF1E40AF'

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
    { header: 'Hình thức', key: 'Hinh_Thuc', width: 18 }
  ])
  config.keHoachDanhGia.forEach((p) =>
    wsKeHoach.addRow({
      Nhom: p.nhom,
      Thanh_Phan: p.thanhPhan,
      Ma_Dau_Diem: p.maDauDiem,
      CLO: p.clo,
      Trong_So_Phan_Tram: p.trongSoPhanTram,
      Hinh_Thuc: p.hinhThuc ?? ''
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

  // 6. HUONG_DAN
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
    [
      'DIEM_DANH',
      'Ký hiệu điểm danh và hệ số quy đổi',
      'Mặc định: X=1, OL=1, M=0.5, V-CP=0.5, V=0 (không cần sửa)'
    ],
    [
      'QUY_TAC',
      'Các tham số nghiệp vụ của nhà trường',
      'Mặc định chuẩn QĐ 450 (không sửa nếu không có yêu cầu từ P.QLCL)'
    ]
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
