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

  it('soTinChi <= 0 / thập phân và Loai_HP lạ -> lỗi', () => {
    const config = mock()
    config.courseInfo.soTinChi = 0
    // @ts-expect-error -- người dùng có thể nhập giá trị lạ từ Excel
    config.courseInfo.loaiHp = 'truc_tuyen'
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: 0).')
    expect(messages).toContain(
      'Loại học phần "truc_tuyen" không hợp lệ (chỉ nhận "thuong" hoặc "thuc_hanh").'
    )

    const config2 = mock()
    config2.courseInfo.soTinChi = 2.5
    const messages2 = errors(validateConfig(config2)).map((i) => i.message)
    expect(messages2).toContain('Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: 2.5).')
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
    expect(wms).toContain(
      'Bậc năng lực "3-6" của CLO "CLO2" sai định dạng — phải dạng bậc/thang (ví dụ 3/6).'
    )
    expect(wms).toContain(
      'Bậc năng lực "7/6" của CLO "CLO3" không hợp lệ — bậc phải là số nguyên từ 1 đến thang (6).'
    )
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

  it('trọng số thập phân nhưng tổng đúng 100 -> CHỈ báo lỗi nguyên, không báo tổng ≠ 100%', () => {
    const config = mock()
    config.keHoachDanhGia[0].trongSoPhanTram = 20.5
    // Bù để tổng vẫn = 100 (20.5 + đổi dòng khác 5 -> 4.5)
    const other = config.keHoachDanhGia.find((p) => p.trongSoPhanTram === 5)!
    other.trongSoPhanTram = 4.5
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages.some((m) => m.includes('phải bằng 100%'))).toBe(false)
    expect(messages).toContain(
      `Trọng số của đầu điểm "${config.keHoachDanhGia[0].maDauDiem}" (CLO "${config.keHoachDanhGia[0].clo}") phải là số nguyên % (nhận 20.5).`
    )
  })

  it('trọng số nguyên nhưng tổng lệch -> báo tổng ≠ 100%', () => {
    const config = mock()
    config.keHoachDanhGia[0].trongSoPhanTram = 19
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Tổng trọng số kế hoạch đánh giá = 99%, phải bằng 100%.')
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

  it('thiếu dữ liệu bắt buộc -> lỗi / cảnh báo', () => {
    const config = mock()
    const row = config.cauHoi[0]
    row.maCotDiem = ''
    row.maDauDiem = ''
    row.clo = ''
    row.cau = ''
    const issues = validateConfig(config)
    const errs = errors(issues).map((i) => i.message)
    const wms = warnings(issues).map((i) => i.message)
    expect(errs).toContain('Thiếu Mã cột điểm.')
    expect(errs).toContain('Thiếu Mã đầu điểm.')
    expect(errs).toContain('Thiếu mã CLO.')
    expect(wms).toContain('Thiếu tên câu hỏi.')
  })

  it('cùng câu nhưng khác CLO trong cùng đề -> hợp lệ', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    // Cùng câu, cùng đề, khác CLO và khác cột -> là các ý a, b của cùng một câu
    config.cauHoi.push({ ...src, maCotDiem: 'GKT_C99', clo: 'CLO5' })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages.some((m) => m.includes('bị trùng tên'))).toBe(false)
  })

  it('cùng cột điểm dùng ở 2 đầu điểm -> lỗi', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    config.cauHoi.push({ ...src, maDauDiem: 'CK', clo: 'CLO5', cau: 'Câu 99' })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain(`Cột điểm "${src.maCotDiem}" được dùng ở nhiều đầu điểm (GKT, CK).`)
  })

  it('cùng cột điểm dùng ở 2 đề nhưng khác CLO -> cảnh báo', () => {
    const config = mock()
    const src = config.cauHoi.find((q) => q.maDauDiem === 'GKT')!
    config.cauHoi.push({ ...src, maDe: 'D9', clo: 'CLO5', cau: 'Câu 99' })
    const wms = warnings(validateConfig(config)).map((i) => i.message)
    expect(wms).toContain(`Cột điểm "${src.maCotDiem}" được dùng ở nhiều đề (D1, D9).`)
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

  it('CLO trống -> lỗi', () => {
    const config = mock()
    config.maTranPlo[0].clo = ''
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('Thiếu mã CLO.')
  })

  it('cùng PI dùng ở 2 PLO -> lỗi', () => {
    const config = mock()
    config.maTranPlo.push({ plo: 'PLO3', pi: 'PI2.1', clo: 'CLO5' })
    const messages = errors(validateConfig(config)).map((i) => i.message)
    expect(messages).toContain('PI "PI2.1" được dùng ở nhiều PLO (PLO2, PLO3).')
  })

  it('PI sai định dạng / không khớp PLO -> cảnh báo', () => {
    const config = mock()
    config.maTranPlo[0].pi = 'PI2'
    config.maTranPlo[1].pi = 'PI9.1'
    const wms = warnings(validateConfig(config)).map((i) => i.message)
    expect(wms).toContain('Mã PI "PI2" không đúng dạng PI<số>.<số> (ví dụ PI2.1).')
    expect(wms).toContain(
      'PI "PI9.1" không khớp PLO "PLO2" — PI phải thuộc đúng PLO theo số hiệu (PI2.x).'
    )
  })

  it('một CLO gắn nhiều PI trong cùng PLO -> cảnh báo', () => {
    const config = mock()
    config.maTranPlo.push({ plo: 'PLO2', pi: 'PI2.9', clo: 'CLO1' })
    const wms = warnings(validateConfig(config)).map((i) => i.message)
    expect(wms).toContain('CLO "CLO1" được gán cho nhiều PI trong PLO "PLO2" (PI2.1, PI2.9).')
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

  it('khoảng trắng thừa trong mã không gây lỗi chéo', () => {
    const config = mock()
    const q = config.cauHoi.find((item) => item.maDauDiem === 'GKT')!
    q.maDauDiem = ` ${q.maDauDiem} `
    q.clo = ` ${q.clo} `
    expect(errors(validateConfig(config))).toHaveLength(0)
  })
})
