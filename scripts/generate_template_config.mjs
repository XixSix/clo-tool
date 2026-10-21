import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../resources/templates/Template_Config.xlsx')

async function generate() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Phần mềm CLO/PLO - Đại học Thành Đông'
  wb.created = new Date()

  // Helper để format header
  function formatHeader(sheet, columns) {
    sheet.columns = columns
    const headerRow = sheet.getRow(1)
    headerRow.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' } // Blue-800
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 26
  }

  // 1. HOC_PHAN
  const sHocPhan = wb.addWorksheet('HOC_PHAN')
  formatHeader(sHocPhan, [
    { header: 'Ma_HP', key: 'ma_hp', width: 16 },
    { header: 'Ten_HP', key: 'ten_hp', width: 32 },
    { header: 'So_Tin_Chi', key: 'so_tin_chi', width: 14 },
    { header: 'Hinh_Thuc_Thi', key: 'hinh_thuc_thi', width: 18 },
    { header: 'Loai_HP', key: 'loai_hp', width: 16 }
  ])
  sHocPhan.addRow({
    ma_hp: 'KTLT101',
    ten_hp: 'Kỹ thuật lập trình',
    so_tin_chi: 3,
    hinh_thuc_thi: 'Tự luận',
    loai_hp: 'thuong'
  })

  // 2. CLO_LIST
  const sClo = wb.addWorksheet('CLO_LIST')
  formatHeader(sClo, [
    { header: 'Ma_CLO', key: 'ma_clo', width: 14 },
    { header: 'Noi_Dung', key: 'noi_dung', width: 50 },
    { header: 'Bac_Nang_Luc', key: 'bac_nang_luc', width: 16 },
    { header: 'Trong_So_CLO', key: 'trong_so_clo', width: 16 }
  ])
  const clos = [
    {
      ma_clo: 'CLO1.1',
      noi_dung: 'Hiểu và vận dụng cấu trúc dữ liệu cơ bản',
      bac_nang_luc: '3/6',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO1.2',
      noi_dung: 'Thiết kế và cài đặt thuật toán giải quyết bài toán',
      bac_nang_luc: '3/6',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO1.3',
      noi_dung: 'Phân tích và tối ưu hóa giải thuật',
      bac_nang_luc: '4/6',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO1.4',
      noi_dung: 'Kiểm thử và sửa lỗi chương trình',
      bac_nang_luc: '3/6',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO2.1',
      noi_dung: 'Làm việc nhóm và giao tiếp chuyên môn',
      bac_nang_luc: '3/5',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO2.2',
      noi_dung: 'Thuyết trình và báo cáo kết quả kỹ thuật',
      bac_nang_luc: '3/5',
      trong_so_clo: 1
    },
    {
      ma_clo: 'CLO3.1',
      noi_dung: 'Ý thức tự học, chuyên cần và trách nhiệm nghề nghiệp',
      bac_nang_luc: '3/5',
      trong_so_clo: 1
    }
  ]
  clos.forEach((c) => sClo.addRow(c))

  // 3. KE_HOACH_DANH_GIA
  const sKeHoach = wb.addWorksheet('KE_HOACH_DANH_GIA')
  formatHeader(sKeHoach, [
    { header: 'Nhom', key: 'nhom', width: 12 },
    { header: 'Thanh_Phan', key: 'thanh_phan', width: 28 },
    { header: 'Ma_Dau_Diem', key: 'ma_dau_diem', width: 16 },
    { header: 'CLO', key: 'clo', width: 14 },
    { header: 'Trong_So_Phan_Tram', key: 'trong_so', width: 22 },
    { header: 'Hinh_Thuc', key: 'hinh_thuc', width: 16 },
    { header: 'Thoi_Diem', key: 'thoi_diem', width: 16 }
  ])
  const keHoach = [
    {
      nhom: 'CC',
      thanh_phan: 'Điểm danh chuyên cần',
      ma_dau_diem: 'CC',
      clo: 'CLO3.1',
      trong_so: 10,
      hinh_thuc: 'Điểm danh',
      thoi_diem: 'Suốt kỳ'
    },
    {
      nhom: 'CC',
      thanh_phan: 'Tự học & Chuẩn bị bài',
      ma_dau_diem: 'TH',
      clo: 'CLO3.1',
      trong_so: 10,
      hinh_thuc: 'Đánh giá trên lớp',
      thoi_diem: 'Suốt kỳ'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 1',
      ma_dau_diem: 'KT1',
      clo: 'CLO1.1',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 5'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 1',
      ma_dau_diem: 'KT1',
      clo: 'CLO1.2',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 5'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 1',
      ma_dau_diem: 'KT1',
      clo: 'CLO1.3',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 5'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 2',
      ma_dau_diem: 'KT2',
      clo: 'CLO1.4',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 10'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 2',
      ma_dau_diem: 'KT2',
      clo: 'CLO2.1',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 10'
    },
    {
      nhom: 'GK',
      thanh_phan: 'Kiểm tra thường xuyên 2',
      ma_dau_diem: 'KT2',
      clo: 'CLO2.2',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Tuần 10'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO1.1',
      trong_so: 10,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO1.2',
      trong_so: 10,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO1.3',
      trong_so: 10,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO1.4',
      trong_so: 10,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO2.1',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    },
    {
      nhom: 'CK',
      thanh_phan: 'Thi kết thúc học phần',
      ma_dau_diem: 'CK',
      clo: 'CLO2.2',
      trong_so: 5,
      hinh_thuc: 'Tự luận',
      thoi_diem: 'Cuối kỳ'
    }
  ]
  keHoach.forEach((k) => sKeHoach.addRow(k))

  // 4. CAU_HOI
  const sCauHoi = wb.addWorksheet('CAU_HOI')
  formatHeader(sCauHoi, [
    { header: 'Ma_Cot_Diem', key: 'ma_cot_diem', width: 16 },
    { header: 'Ma_Dau_Diem', key: 'ma_dau_diem', width: 16 },
    { header: 'Cau', key: 'cau', width: 14 },
    { header: 'CLO', key: 'clo', width: 14 },
    { header: 'Diem_Toi_Da', key: 'diem_toi_da', width: 16 },
    { header: 'Ma_De', key: 'ma_de', width: 12 },
    { header: 'Loai', key: 'loai', width: 12 }
  ])
  const cauHoi = [
    {
      ma_cot_diem: 'CC',
      ma_dau_diem: 'CC',
      cau: 'CC',
      clo: 'CLO3.1',
      diem_toi_da: 10,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'TH',
      ma_dau_diem: 'TH',
      cau: 'TH',
      clo: 'CLO3.1',
      diem_toi_da: 10,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT1_C1',
      ma_dau_diem: 'KT1',
      cau: 'Câu 1',
      clo: 'CLO1.1',
      diem_toi_da: 3,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT1_C2',
      ma_dau_diem: 'KT1',
      cau: 'Câu 2',
      clo: 'CLO1.2',
      diem_toi_da: 3,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT1_C3',
      ma_dau_diem: 'KT1',
      cau: 'Câu 3',
      clo: 'CLO1.3',
      diem_toi_da: 4,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT2_C1',
      ma_dau_diem: 'KT2',
      cau: 'Câu 1',
      clo: 'CLO1.4',
      diem_toi_da: 4,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT2_C2',
      ma_dau_diem: 'KT2',
      cau: 'Câu 2',
      clo: 'CLO2.1',
      diem_toi_da: 3,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'KT2_C3',
      ma_dau_diem: 'KT2',
      cau: 'Câu 3',
      clo: 'CLO2.2',
      diem_toi_da: 3,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C1',
      ma_dau_diem: 'CK',
      cau: 'Câu 1',
      clo: 'CLO1.1',
      diem_toi_da: 2,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C2',
      ma_dau_diem: 'CK',
      cau: 'Câu 2',
      clo: 'CLO1.2',
      diem_toi_da: 2,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C3',
      ma_dau_diem: 'CK',
      cau: 'Câu 3',
      clo: 'CLO1.3',
      diem_toi_da: 2,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C4',
      ma_dau_diem: 'CK',
      cau: 'Câu 4',
      clo: 'CLO1.4',
      diem_toi_da: 2,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C5',
      ma_dau_diem: 'CK',
      cau: 'Câu 5',
      clo: 'CLO2.1',
      diem_toi_da: 1,
      ma_de: 'ALL',
      loai: 'TL'
    },
    {
      ma_cot_diem: 'CK_C6',
      ma_dau_diem: 'CK',
      cau: 'Câu 6',
      clo: 'CLO2.2',
      diem_toi_da: 1,
      ma_de: 'ALL',
      loai: 'TL'
    }
  ]
  cauHoi.forEach((c) => sCauHoi.addRow(c))

  // 5. MA_TRAN_PLO
  const sPlo = wb.addWorksheet('MA_TRAN_PLO')
  formatHeader(sPlo, [
    { header: 'PLO', key: 'plo', width: 14 },
    { header: 'PI', key: 'pi', width: 14 },
    { header: 'CLO', key: 'clo', width: 14 }
  ])
  const ploMatrix = [
    { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO1.1' },
    { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO1.2' },
    { plo: 'PLO3', pi: 'PI3.2', clo: 'CLO1.3' },
    { plo: 'PLO3', pi: 'PI3.2', clo: 'CLO1.4' },
    { plo: 'PLO5', pi: 'PI5.1', clo: 'CLO2.1' },
    { plo: 'PLO5', pi: 'PI5.2', clo: 'CLO2.2' },
    { plo: 'PLO6', pi: 'PI6.1', clo: 'CLO2.2' },
    { plo: 'PLO9', pi: 'PI9.1', clo: 'CLO3.1' }
  ]
  ploMatrix.forEach((p) => sPlo.addRow(p))

  // 6. DIEM_DANH
  const sDiemDanh = wb.addWorksheet('DIEM_DANH')
  formatHeader(sDiemDanh, [
    { header: 'Ky_Hieu', key: 'ky_hieu', width: 16 },
    { header: 'He_So', key: 'he_so', width: 14 },
    { header: 'Dien_Giai', key: 'dien_giai', width: 36 }
  ])
  const diemDanh = [
    { ky_hieu: 'X', he_so: 1.0, dien_giai: 'Có mặt đúng giờ' },
    { ky_hieu: 'OL', he_so: 1.0, dien_giai: 'Học online có mặt' },
    { ky_hieu: 'M', he_so: 0.5, dien_giai: 'Đi muộn hoặc về sớm' },
    { ky_hieu: 'V-CP', he_so: 0.5, dien_giai: 'Vắng có phép' },
    { ky_hieu: 'V', he_so: 0.0, dien_giai: 'Vắng không phép' }
  ]
  diemDanh.forEach((d) => sDiemDanh.addRow(d))

  // 7. QUY_TAC
  const sQuyTac = wb.addWorksheet('QUY_TAC')
  formatHeader(sQuyTac, [
    { header: 'Ma_Quy_Tac', key: 'ma_quy_tac', width: 22 },
    { header: 'Gia_Tri', key: 'gia_tri', width: 20 },
    { header: 'Mo_Ta', key: 'mo_ta', width: 55 }
  ])
  const quyTac = [
    {
      ma_quy_tac: 'hp_method',
      gia_tri: 'QD450',
      mo_ta: 'Cách tính điểm học phần (QD450: TBC CLO nhóm; RAW_POINTS: điểm thô)'
    },
    {
      ma_quy_tac: 'nguong_dat_clo',
      gia_tri: '4.0',
      mo_ta: 'Ngưỡng điểm Đạt của một CLO (Quyết định #2)'
    },
    {
      ma_quy_tac: 'nguong_dat_plo',
      gia_tri: '4.0',
      mo_ta: 'Ngưỡng điểm Đạt của PLO thành phần (QĐ450 Điều 10)'
    },
    {
      ma_quy_tac: 'clo_bo_phan',
      gia_tri: 'mean_of_ratios',
      mo_ta: 'Gộp điểm nhiều câu (mean_of_ratios: TBC tỷ lệ d/t; ratio_of_sums: tổng d / tổng t)'
    },
    {
      ma_quy_tac: 'rounding_mode',
      gia_tri: 'chain',
      mo_ta:
        'Làm tròn (chain: làm tròn từng bước dùng cho bước sau; final_only: chỉ làm tròn khi xuất)'
    },
    {
      ma_quy_tac: 'tinh_sv_vang_thi',
      gia_tri: 'true',
      mo_ta: 'SV vắng thi tính vào mẫu số % đạt CLO với điểm 0 (true/false)'
    },
    {
      ma_quy_tac: 'canh_bao_cc_don_le',
      gia_tri: 'true',
      mo_ta: 'Cảnh báo khi CLO chỉ đo bằng chuyên cần/thái độ (không chặn)'
    },
    {
      ma_quy_tac: 'ty_le_nhom_27',
      gia_tri: '0.27',
      mo_ta: 'Tỷ lệ phân nhóm 27% trên/dưới tính độ phân biệt d'
    },
    {
      ma_quy_tac: 'nguong_co_mau_n',
      gia_tri: '30',
      mo_ta: 'Ngưỡng cảnh báo độ tin cậy khi cỡ mẫu N < 30'
    }
  ]
  quyTac.forEach((q) => sQuyTac.addRow(q))

  // Đặt border và căn dòng cho toàn bộ cell
  wb.eachSheet((sheet) => {
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.font = { name: 'Times New Roman', size: 11 }
        row.alignment = { vertical: 'middle' }
      }
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        }
      })
    })
  })

  await wb.xlsx.writeFile(outputPath)
  console.log('Generated template at:', outputPath)
}

generate().catch(console.error)
