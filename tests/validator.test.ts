/**
 * Test bộ validator tách module theo từng sheet (mục V).
 *
 * Cấu hình mẫu (buildMockConfig) phải không có LỖI nào với tất cả check mới,
 * các case dưới đây mutate 1 trường rồi kiểm tra đúng issue phát ra.
 */

import { describe, it, expect } from 'vitest'
import { validateConfig } from '@core/index'
import { buildMockConfig } from './fixtures/mockClass'

function mock(): ReturnType<typeof buildMockConfig> {
  return buildMockConfig()
}

const errors = (issues: ReturnType<typeof validateConfig>) =>
  issues.filter((i) => i.level === 'error')
const warnings = (issues: ReturnType<typeof validateConfig>) =>
  issues.filter((i) => i.level === 'warning')

describe('validateConfig - cấu hình mẫu sạch', () => {
  it('mock chuẩn không có lỗi nào', () => {
    expect(errors(validateConfig(mock()))).toHaveLength(0)
  })
})

describe('validateHocPhan - sheet HOC_PHAN', () => {
  it('thiếu Ma_HP / Ten_HP -> lỗi', () => {
    const config = mock()
    config.courseInfo.maHp = ''
    config.courseInfo.tenHp = ' '
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Thiếu Mã học phần (Ma_HP).')
    expect(messages).toContain('Thiếu Tên học phần (Ten_HP).')
  })

  it('soTinChi <= 0 và Loai_HP lạ -> lỗi', () => {
    const config = mock()
    config.courseInfo.soTinChi = 0
    // @ts-expect-error -- người dùng có thể nhập giá trị lạ từ Excel
    config.courseInfo.loaiHp = 'truc_tuyen'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Số tín chỉ phải lớn hơn 0 (hiện tại: 0).')
    expect(messages).toContain(
      'Loại học phần "truc_tuyen" không hợp lệ (chỉ nhận "thuong" hoặc "thuc_hanh").'
    )
  })

  it('Hinh_Thuc_Thi trống -> chỉ cảnh báo', () => {
    const config = mock()
    config.courseInfo.hinhThucThi = ''
    const issues = validateConfig(config)
    expect(errors(issues)).toHaveLength(0)
    expect(warnings(issues).some((w) => w.message.includes('Hình thức thi'))).toBe(true)
  })
})

describe('validateCloList - sheet CLO_LIST', () => {
  it('mã CLO không đúng dạng CLOx -> lỗi', () => {
    const config = mock()
    config.cloList[0].maClo = 'CL1'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      'Mã CLO "CL1" phải theo dạng CLOx hoặc CLOx.y (ví dụ CLO1, CLO2, CLO1.1).'
    )
  })

  it('mã CLO dạng phân cấp CLO1.1 được chấp nhận', () => {
    const config = mock()
    config.cloList[0].maClo = 'CLO1.1'
    // Cập nhật tham chiếu cho khớp để không phát lỗi chéo
    config.keHoachDanhGia.forEach((p) => {
      if (p.clo === 'CLO1') p.clo = 'CLO1.1'
    })
    config.cauHoi.forEach((q) => {
      if (q.clo === 'CLO1') q.clo = 'CLO1.1'
    })
    config.maTranPlo.forEach((m) => {
      if (m.clo === 'CLO1') m.clo = 'CLO1.1'
    })
    expect(errors(validateConfig(config))).toHaveLength(0)
  })

  it('mã CLO trống / lặp -> lỗi', () => {
    const config = mock()
    config.cloList[0].maClo = ''
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Thiếu Mã CLO.')

    const config2 = mock()
    config2.cloList.push({ ...config2.cloList[0] })
    const messages2 = errors(validateConfig(config2)).map((i) => i.message)
    expect(messages2).toContain('Mã CLO "CLO1" bị lặp.')
  })

  it('Noi_Dung trống -> cảnh báo', () => {
    const config = mock()
    config.cloList[0].noiDung = ''
    const issues = validateConfig(config)
    expect(errors(issues)).toHaveLength(0)
    expect(warnings(issues).some((w) => w.message.includes('thiếu nội dung'))).toBe(true)
  })

  it('Trong_So_CLO ngoài (0..100] -> lỗi', () => {
    const config = mock()
    config.cloList[0].trongSoClo = 120
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Trọng số CLO của "CLO1" phải thuộc (0..100].')
  })

  it('Bac_Nang_Luc trống / sai định dạng / bậc vượt thang -> cảnh báo (chỉ hiển thị, không tính điểm)', () => {
    const config = mock()
    config.cloList[0].bacNangLuc = ''
    config.cloList[1].bacNangLuc = '3-6'
    config.cloList[2].bacNangLuc = '7/6'
    const issues = validateConfig(config)
    expect(errors(issues)).toHaveLength(0)
    const wms = warnings(issues).map((w) => w.message)
    expect(wms).toContain('CLO "CLO1" thiếu bậc năng lực (Bac_Nang_Luc).')
    expect(wms).toContain('Bậc năng lực "3-6" của CLO "CLO2" sai định dạng — phải dạng bậc/thang (ví dụ 3/6).')
    expect(wms).toContain('Bậc năng lực "7/6" của CLO "CLO3" không hợp lệ — bậc phải là số nguyên từ 1 đến thang (6).')
  })
})

describe('validateKeHoach - sheet KE_HOACH_DANH_GIA', () => {
  it('trọng số không nguyên -> lỗi', () => {
    const config = mock()
    const [row0, row1] = config.keHoachDanhGia
    row0.trongSoPhanTram = 20.5
    // Bù lại dòng khác để tổng vẫn 100, tránh lỗi chồng lấn nhiễu
    row1.trongSoPhanTram -= 0.5
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      `Trọng số của đầu điểm "${row0.maDauDiem}" (CLO "${row0.clo}") phải là số nguyên % (nhận 20.5).`
    )
    expect(messages).toContain(
      `Trọng số của đầu điểm "${row1.maDauDiem}" (CLO "${row1.clo}") phải là số nguyên % (nhận ${row1.trongSoPhanTram}).`
    )
  })

  it('trọng số <= 0 -> lỗi', () => {
    const config = mock()
    config.keHoachDanhGia[0].trongSoPhanTram = 0
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Trọng số của đầu điểm "CC" phải lớn hơn 0.')
  })

  it('Nhóm ngoài CC/GK/CK -> lỗi', () => {
    const config = mock()
    // @ts-expect-error -- nhóm lạ từ Excel
    config.keHoachDanhGia[0].nhom = 'LAB'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Nhóm "LAB" không hợp lệ (chỉ nhận CC, GK, CK).')
  })

  it('cùng mã đầu điểm ở cả GK và CK -> lỗi, riêng GK/GX không báo', () => {
    const config = mock()
    // Sửa một dòng GK để có cùng mã đầu điểm với dòng CK
    const ckRow = config.keHoachDanhGia.find((p) => p.nhom === 'CK')!
    const gkRow = config.keHoachDanhGia.find((p) => p.nhom === 'GK')!
    gkRow.maDauDiem = ckRow.maDauDiem
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(`Mã đầu điểm "${ckRow.maDauDiem}" bị dùng ở cả nhóm GK và CK.`)
  })

  it('cặp (đầu điểm, CLO) lặp -> lỗi', () => {
    const config = mock()
    const first = config.keHoachDanhGia[0]
    config.keHoachDanhGia.push({ ...first })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      `Cặp đầu điểm "${first.maDauDiem}" – CLO "${first.clo}" bị lặp trong kế hoạch.`
    )
  })

  it('Ma_Dau_Diem trống -> lỗi', () => {
    const config = mock()
    config.keHoachDanhGia[0].maDauDiem = ''
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Thiếu Mã đầu điểm.')
  })
})

describe('validateCauHoi - sheet CAU_HOI', () => {
  it('Diem_Toi_Da <= 0 -> lỗi', () => {
    const config = mock()
    config.cauHoi[0].diemToiDa = 0
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Điểm tối đa của cột "CC" phải lớn hơn 0.')
  })

  it('cột điểm dùng cho 2 câu trong cùng ô -> lỗi trùng lặp', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    config.cauHoi.push({ ...src, cau: 'Câu 41' })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      `Cột điểm "${src.maCotDiem}" được dùng cho nhiều câu trong cùng ô (đầu điểm "GKT" – CLO "${src.clo}") làm trùng lặp điểm.`
    )
  })

  it('cùng cột điểm khai điểm tối đa khác nhau -> lỗi', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    const renamed = {
      ...src,
      maDauDiem: 'CK',
      clo: 'CLO5',
      cau: 'Câu 6',
      diemToiDa: src.diemToiDa + 0.25
    }
    config.cauHoi.push(renamed)
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      `Cột điểm "${src.maCotDiem}" được khai với điểm tối đa khác nhau (${src.diemToiDa} và ${renamed.diemToiDa}).`
    )
  })

  it('trùng tên câu trong cùng đề -> lỗi', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    config.cauHoi.push({ ...src, maCotDiem: 'GKT_C99' })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(`Câu "${src.cau}" bị trùng tên trong đề GKT/${src.maDe ?? 'ALL'}.`)
  })

  it('Ma_De trống -> cảnh báo (coi ALL); Loai ngoài TN/TL -> cảnh báo', () => {
    const config = mock()
    const cc = config.cauHoi.find((q) => q.maCotDiem === 'CC')!
    cc.maDe = ''
    // @ts-expect-error -- loại lạ từ Excel
    cc.loai = 'TH'
    const issues = validateConfig(config)
    expect(errors(issues)).toHaveLength(0)
    const wms = warnings(issues).map((w) => w.message)
    expect(wms).toContain(
      `Câu "${cc.cau}" (cột "CC") chưa khai mã đề — sẽ coi là áp dụng cho mọi đề (ALL).`
    )
    expect(wms).toContain('Loại câu hỏi "TH" của cột "CC" không thuộc TN/TL.')
  })
})

describe('validateMaTranPlo - sheet MA_TRAN_PLO', () => {
  it('bộ ba (PLO, PI, CLO) lặp -> lỗi', () => {
    const config = mock()
    config.maTranPlo.push({ ...config.maTranPlo[0] })
    const m = config.maTranPlo[0]
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      `Ánh xạ (PLO "${m.plo}", PI "${m.pi}", CLO "${m.clo}") bị lặp làm trùng lặp dữ liệu.`
    )
  })

  it('PLO / PI trống -> lỗi', () => {
    const config = mock()
    config.maTranPlo[0].plo = ''
    config.maTranPlo[1].pi = ''
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Thiếu mã PLO.')
    expect(messages).toContain('Thiếu mã PI.')
  })
})

describe('validateDiemDanh - sheet DIEM_DANH', () => {
  it('ký hiệu lặp / trống -> lỗi', () => {
    const config = mock()
    config.diemDanh!.push({ ...config.diemDanh![0] })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Ký hiệu điểm danh "X" bị lặp.')

    const config2 = mock()
    config2.diemDanh![0].kyHieu = ''
    const messages2 = errors(validateConfig(config2)).map((i) => i.message)
    expect(messages2).toContain('Ký hiệu điểm danh không được trống.')
  })

  it('heSo ngoài [0, 1] -> lỗi', () => {
    const config = mock()
    config.diemDanh![0].heSo = 1.5
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Hệ số của ký hiệu "X" phải trong khoảng [0, 1] (nhận 1.5).')
  })
})

describe('validateQuyTac - sheet QUY_TAC', () => {
  it('enum lạ -> lỗi thay vì rơi về mặc định im lặng', () => {
    const config = mock()
    // @ts-expect-error -- giá trị lạ từ Excel
    config.quyTac.hp_method = 'ABCD'
    // @ts-expect-error -- giá trị lạ từ Excel
    config.quyTac.rounding_mode = 'round'
    // @ts-expect-error -- giá trị lạ từ Excel
    config.quyTac.clo_bo_phan = 'sum'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('quyTac.hp_method "ABCD" không hợp lệ (QD450 / RAW_POINTS).')
    expect(messages).toContain('quyTac.rounding_mode "round" không hợp lệ (chain / final_only).')
    expect(messages).toContain(
      'quyTac.clo_bo_phan "sum" không hợp lệ (mean_of_ratios / ratio_of_sums).'
    )
  })

  it('ngưỡng ngoài [0..10] và tỷ lệ ngoài khoảng -> lỗi', () => {
    const config = mock()
    config.quyTac.nguong_dat_clo = 12
    config.quyTac.ty_le_nhom_27 = 1.5
    config.quyTac.ty_le_dat_clo_canh_bao = -5
    config.quyTac.nguong_co_mau_n = -1
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(
      'nguong_dat_clo = 12 không hợp lệ — ngưỡng đạt phải trong khoảng [0, 10].'
    )
    expect(messages).toContain(
      'ty_le_nhom_27 = 1.5 không hợp lệ — phải là tỷ lệ trong khoảng [0, 1].'
    )
    expect(messages).toContain(
      'ty_le_dat_clo_canh_bao = -5 không hợp lệ — phải trong khoảng [0, 100].'
    )
    expect(messages).toContain(
      'nguong_co_mau_n = -1 không hợp lệ — phải là số nguyên dương hoặc 0.'
    )
  })
})

describe('validateCrossSheet - check chéo được giữ nguyên', () => {
  it('CLO không tồn tại / không được đo / cặp lệch 2 chiều -> lỗi với thông báo cũ', () => {
    const config = mock()
    config.keHoachDanhGia[0].clo = 'CLO_KHONG_TON_TAI'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Mã CLO "CLO_KHONG_TON_TAI" không có trong sheet CLO_LIST.')
  })

  it('CLO không được đầu điểm nào đo -> lỗi', () => {
    const config = mock()
    const last = config.cloList[config.cloList.length - 1]
    config.keHoachDanhGia = config.keHoachDanhGia.filter((p) => p.clo !== last.maClo)
    config.cauHoi = config.cauHoi.filter((q) => q.clo !== last.maClo)
    config.maTranPlo = config.maTranPlo.filter((m) => m.clo !== last.maClo)
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(`CLO "${last.maClo}" không được đầu điểm nào đo.`)
  })
})
