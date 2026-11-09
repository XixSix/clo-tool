/**
 * Test bộ validator tách module theo từng phần của model Course (mục V).
 *
 * Cấu hình mẫu (buildMockCourse) phải không có LỖI nào với tất cả check mới,
 * các case dưới đây mutate 1 trường rồi kiểm tra đúng issue phát ra.
 */

import { describe, it, expect } from 'vitest'
import { validateCourse } from '@core/index'
import type { Course, ExamQuestion } from '@core/types'
import { buildMockCourse } from './fixtures/mockClass'

function mock(): Course {
  return buildMockCourse()
}

const errors = (issues: ReturnType<typeof validateCourse>) =>
  issues.filter((i) => i.level === 'error')
const warnings = (issues: ReturnType<typeof validateCourse>) =>
  issues.filter((i) => i.level === 'warning')

/** Lấy câu hỏi đầu tiên của đợt GKT (đề D1). */
function firstGktQuestion(course: Course): ExamQuestion {
  const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
  return dot.maDeList[0].cauHoi[0]
}

describe('validateCourse - cấu hình mẫu sạch', () => {
  it('mock chuẩn không có lỗi nào', () => {
    expect(errors(validateCourse(mock()))).toHaveLength(0)
  })
})

describe('validateHocPhan - phần HOC_PHAN', () => {
  it('thiếu Ma_HP / Ten_HP -> lỗi', () => {
    const course = mock()
    course.maHp = ''
    course.tenHp = ' '
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Thiếu Mã học phần (Ma_HP).')
    expect(messages).toContain('Thiếu Tên học phần (Ten_HP).')
  })

  it('soTinChi <= 0 / thập phân và Loai_HP lạ -> lỗi', () => {
    const course = mock()
    course.soTinChi = 0
    // @ts-expect-error -- người dùng có thể nhập giá trị lạ
    course.loaiHp = 'truc_tuyen'
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: 0).')
    expect(messages).toContain(
      'Loại học phần "truc_tuyen" không hợp lệ (chỉ nhận "thuong" hoặc "thuc_hanh").'
    )

    const course2 = mock()
    course2.soTinChi = 2.5
    const messages2 = errors(validateCourse(course2)).map((i) => i.message)
    expect(messages2).toContain('Số tín chỉ phải là số nguyên lớn hơn 0 (hiện tại: 2.5).')
  })

  it('Hinh_Thuc_Thi trống -> chỉ cảnh báo', () => {
    const course = mock()
    course.hinhThucThi = ''
    const issues = validateCourse(course)
    expect(errors(issues)).toHaveLength(0)
    expect(warnings(issues).some((w) => w.message.includes('Hình thức thi'))).toBe(true)
  })
})

describe('validateCloList - phần CLO_LIST', () => {
  it('mã CLO không đúng dạng CLOx -> lỗi', () => {
    const course = mock()
    course.cloList[0].maClo = 'CL1'
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      'Mã CLO "CL1" phải theo dạng CLOx hoặc CLOx.y (ví dụ CLO1, CLO2, CLO1.1).'
    )
  })

  it('mã CLO dạng phân cấp CLO1.1 được chấp nhận', () => {
    const course = mock()
    course.cloList[0].maClo = 'CLO1.1'
    expect(errors(validateCourse(course))).toHaveLength(0)
  })

  it('mã CLO trống / lặp -> lỗi', () => {
    const course = mock()
    course.cloList[0].maClo = ''
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Thiếu Mã CLO.')

    const course2 = mock()
    course2.cloList.push({ ...course2.cloList[0] })
    const messages2 = errors(validateCourse(course2)).map((i) => i.message)
    expect(messages2).toContain('Mã CLO "CLO1" bị lặp.')
  })

  it('Noi_Dung trống -> cảnh báo', () => {
    const course = mock()
    course.cloList[0].noiDung = ''
    const issues = validateCourse(course)
    expect(errors(issues)).toHaveLength(0)
    expect(warnings(issues).some((w) => w.message.includes('thiếu nội dung'))).toBe(true)
  })

  it('Trong_So_CLO ngoài (0..100] -> lỗi', () => {
    const course = mock()
    course.cloList[0].trongSoClo = 120
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Trọng số CLO của "CLO1" phải thuộc (0..100].')
  })

  it('Học phần thực hành thiếu Trong_So_CLO -> lỗi', () => {
    const course = mock()
    course.loaiHp = 'thuc_hanh'
    delete course.cloList[0].trongSoClo
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(
      messages.some((m) => m.includes('Học phần thực hành yêu cầu khai báo Trọng số CLO'))
    ).toBe(true)
  })

  it('Học phần thực hành tổng Trong_So_CLO ≠ 100 -> lỗi', () => {
    const course = mock()
    course.loaiHp = 'thuc_hanh'
    // 5 CLO × 10% = 50% → thiếu
    course.cloList.forEach((c) => (c.trongSoClo = 10))
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Học phần thực hành yêu cầu tổng Trọng số CLO = 100% (hiện 50%).')
  })

  it('Học phần thực hành tổng Trong_So_CLO = 100 -> không lỗi', () => {
    const course = mock()
    course.loaiHp = 'thuc_hanh'
    course.cloList.forEach((c) => (c.trongSoClo = 20))
    expect(errors(validateCourse(course))).toHaveLength(0)
  })

  it('Bac_Nang_Luc trống / sai định dạng / bậc vượt thang -> cảnh báo', () => {
    const course = mock()
    course.cloList[0].bacNangLuc = ''
    course.cloList[1].bacNangLuc = '3-6'
    course.cloList[2].bacNangLuc = '7/6'
    const issues = validateCourse(course)
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

describe('validateKeHoach - phần KE_HOACH_DANH_GIA', () => {
  it('trọng số không nguyên -> lỗi', () => {
    const course = mock()
    const [dot0, dot1] = course.dotDanhGia
    dot0.trongSoPhanTram = 20.5
    // Bù lại đợt khác để tổng vẫn 100, tránh lỗi chồng lấn nhiễu
    dot1.trongSoPhanTram -= 0.5
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`Trọng số của đợt "${dot0.id}" phải là số nguyên % (nhận 20.5).`)
    expect(messages).toContain(
      `Trọng số của đợt "${dot1.id}" phải là số nguyên % (nhận ${dot1.trongSoPhanTram}).`
    )
  })

  it('trọng số thập phân nhưng tổng đúng 100 -> CHỈ báo lỗi nguyên, không báo tổng ≠ 100%', () => {
    const course = mock()
    course.dotDanhGia[0].trongSoPhanTram = 20.5
    // Bù để tổng vẫn = 100 (20.5 + đổi đợt khác 15 -> 14.5)
    course.dotDanhGia[1].trongSoPhanTram -= 0.5
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages.some((m) => m.includes('phải bằng 100%'))).toBe(false)
    expect(messages).toContain(
      `Trọng số của đợt "${course.dotDanhGia[0].id}" phải là số nguyên % (nhận 20.5).`
    )
  })

  it('trọng số nguyên nhưng tổng lệch -> báo tổng ≠ 100%', () => {
    const course = mock()
    course.dotDanhGia[0].trongSoPhanTram = 19
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Tổng trọng số kế hoạch đánh giá = 99%, phải bằng 100%.')
  })

  it('trọng số <= 0 -> lỗi', () => {
    const course = mock()
    course.dotDanhGia[0].trongSoPhanTram = 0
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`Trọng số của đợt "${course.dotDanhGia[0].id}" phải lớn hơn 0.`)
  })

  it('Nhóm ngoài CC/GK/CK -> lỗi', () => {
    const course = mock()
    // @ts-expect-error -- nhóm lạ
    course.dotDanhGia[0].nhom = 'LAB'
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Nhóm "LAB" không hợp lệ (chỉ nhận CC, GK, CK).')
  })

  it('mã đợt đánh giá lặp -> lỗi', () => {
    const course = mock()
    const ck = course.dotDanhGia.find((d) => d.nhom === 'CK')!
    const gk = course.dotDanhGia.find((d) => d.nhom === 'GK')!
    gk.id = ck.id
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`Mã đợt đánh giá "${ck.id}" bị lặp.`)
  })

  it('CLO lặp trong một đợt -> lỗi', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.nhom === 'GK')!
    dot.cloList.push({ ...dot.cloList[0] })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`CLO "${dot.cloList[0].cloId}" bị lặp trong đợt "${dot.id}".`)
  })

  it('mã đợt đánh giá trống -> lỗi', () => {
    const course = mock()
    course.dotDanhGia[0].id = ''
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Thiếu mã đợt đánh giá.')
  })
})

describe('validateCauHoi - phần CAU_HOI', () => {
  it('Diem_Toi_Da <= 0 -> lỗi', () => {
    const course = mock()
    const q = firstGktQuestion(course)
    q.diemToiDa = 0
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`Điểm tối đa của câu "${q.id}" phải lớn hơn 0.`)
  })

  it('cột điểm dùng cho 2 câu trong cùng ô -> lỗi trùng lặp', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const variant = dot.maDeList[0]
    const src = variant.cauHoi[0]
    variant.cauHoi.push({ ...src, cau: 'Câu 41' })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      `Cột điểm "${src.id}" được dùng cho nhiều câu trong cùng ô (đợt "${dot.id}" – CLO "${src.cloId}") làm trùng lặp điểm.`
    )
  })

  it('cùng cột điểm khai điểm tối đa khác nhau -> lỗi', () => {
    const course = mock()
    const ck = course.dotDanhGia.find((d) => d.id === 'CK')!
    const src = firstGktQuestion(course)
    const renamed = {
      ...src,
      cloId: 'CLO5',
      cau: 'Câu 6',
      diemToiDa: src.diemToiDa + 0.25
    }
    ck.maDeList[0].cauHoi.push(renamed)
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      `Cột điểm "${src.id}" được khai với điểm tối đa khác nhau (${src.diemToiDa} và ${renamed.diemToiDa}).`
    )
  })

  it('trùng tên câu trong cùng đề -> lỗi', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const variant = dot.maDeList[0]
    const src = variant.cauHoi[0]
    variant.cauHoi.push({ ...src, id: 'GKT_C99' })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`Câu "${src.cau}" bị trùng tên trong đề ${dot.id}/${variant.maDe}.`)
  })

  it('Ma_De trống -> cảnh báo (coi ALL); Loai ngoài TN/TL -> cảnh báo', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const variant = dot.maDeList[0]
    variant.maDe = ''
    const q = variant.cauHoi[0]
    // @ts-expect-error -- loại lạ
    q.loai = 'TH'
    const issues = validateCourse(course)
    const wms = warnings(issues).map((w) => w.message)
    expect(wms).toContain(
      `Câu "${q.cau}" (cột "${q.id}") chưa khai mã đề — sẽ coi là áp dụng cho mọi đề (ALL).`
    )
    expect(wms).toContain(`Loại câu hỏi "TH" của câu "${q.id}" không thuộc TN/TL.`)
  })

  it('thiếu dữ liệu bắt buộc -> lỗi / cảnh báo', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const q = dot.maDeList[0].cauHoi[0]
    q.id = ''
    q.cloId = ''
    q.cau = ''
    const issues = validateCourse(course)
    const errs = errors(issues).map((i) => i.message)
    const wms = warnings(issues).map((i) => i.message)
    expect(errs).toContain('Thiếu mã cột điểm câu hỏi.')
    expect(errs).toContain('Thiếu mã CLO.')
    expect(wms).toContain('Thiếu tên câu hỏi.')

    const course2 = mock()
    course2.dotDanhGia.find((d) => d.id === 'GKT')!.id = ''
    expect(errors(validateCourse(course2)).map((i) => i.message)).toContain(
      'Thiếu mã đợt đánh giá.'
    )
  })

  it('cùng câu nhưng khác CLO trong cùng đề -> hợp lệ', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const variant = dot.maDeList[0]
    const src = variant.cauHoi[0]
    // Cùng câu, cùng đề, khác CLO và khác cột -> là các ý a, b của cùng một câu
    variant.cauHoi.push({ ...src, id: 'GKT_C99', cloId: 'CLO5' })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages.some((m) => m.includes('bị trùng tên'))).toBe(false)
  })

  it('cùng cột điểm dùng ở 2 đợt đánh giá -> lỗi', () => {
    const course = mock()
    const ck = course.dotDanhGia.find((d) => d.id === 'CK')!
    const gkt = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const src = firstGktQuestion(course)
    ck.maDeList[0].cauHoi.push({ ...src, cloId: 'CLO5', cau: 'Câu 99' })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      `Cột điểm "${src.id}" được dùng ở nhiều đợt đánh giá (${gkt.id}, CK).`
    )
  })

  it('cùng cột điểm dùng ở 2 đề nhưng khác CLO -> cảnh báo', () => {
    const course = mock()
    const dot = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const src = firstGktQuestion(course)
    dot.maDeList.push({
      id: 'GKT_D9',
      maDe: 'D9',
      cauHoi: [{ ...src, cloId: 'CLO5', cau: 'Câu 99' }]
    })
    const wms = warnings(validateCourse(course)).map((w) => w.message)
    expect(wms).toContain(`Cột điểm "${src.id}" được dùng ở nhiều đề (D1, D9).`)
  })
})

describe('validateMaTranPlo - phần MA_TRAN_PLO', () => {
  it('PLO / PI trống -> lỗi', () => {
    const course = mock()
    course.ploList[0].maPlo = ''
    course.piList[0].maPi = ''
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Thiếu mã PLO.')
    expect(messages).toContain('Thiếu mã PI.')
  })

  it('PI trỏ tới CLO không tồn tại -> lỗi', () => {
    const course = mock()
    course.piList[0].cloIds = ['CLO_KHONG_TON_TAI']
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      `PI "${course.piList[0].maPi}" trỏ tới CLO không tồn tại ("CLO_KHONG_TON_TAI").`
    )
  })

  it('cùng PI dùng ở 2 PLO -> lỗi', () => {
    const course = mock()
    // Ghép PI2.1 vào thêm PLO thành phần của PLO3
    const plo3Partial = course.ploThanhPhanList.find((p) => p.maPlo === 'PLO3')!
    plo3Partial.piIds.push('PI2.1')
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('PI "PI2.1" được dùng ở nhiều PLO (PLO2, PLO3).')
  })

  it('PI sai định dạng / không khớp PLO -> cảnh báo', () => {
    const course = mock()
    course.piList[0].maPi = 'PI2'
    course.piList[1].maPi = 'PI9.1'
    const wms = warnings(validateCourse(course)).map((w) => w.message)
    expect(wms).toContain('Mã PI "PI2" không đúng dạng PI<số>.<số> (ví dụ PI2.1).')
    expect(wms).toContain(
      'PI "PI9.1" không khớp PLO "PLO2" — PI phải thuộc đúng PLO theo số hiệu (PI2.x).'
    )
  })

  it('một CLO gắn nhiều PI trong cùng PLO -> cảnh báo', () => {
    const course = mock()
    const plo2Partial = course.ploThanhPhanList.find((p) => p.maPlo === 'PLO2')!
    plo2Partial.piIds.push('PI2.9')
    course.piList.push({
      id: 'PI2.9',
      maPi: 'PI2.9',
      noiDung: 'Chỉ số bổ sung',
      ploThanhPhanIds: ['PLO2_1'],
      cloIds: ['CLO1']
    })
    const wms = warnings(validateCourse(course)).map((w) => w.message)
    expect(wms).toContain('CLO "CLO1" được gán cho nhiều PI trong PLO "PLO2" (PI2.1, PI2.9).')
  })
})

describe('validateCrossSheet - check chéo giữa các phần', () => {
  it('CLO không tồn tại trong danh mục -> lỗi', () => {
    const course = mock()
    course.dotDanhGia[0].cloList[0].cloId = 'CLO_KHONG_TON_TAI'
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('CLO "CLO_KHONG_TON_TAI" không có trong danh mục CLO.')
  })

  it('CLO không được đợt đánh giá nào đo -> lỗi', () => {
    const course = mock()
    const last = course.cloList[course.cloList.length - 1]
    course.dotDanhGia.forEach((dot) => {
      dot.cloList = dot.cloList.filter((m) => m.cloId !== last.id)
      dot.maDeList.forEach((variant) => {
        variant.cauHoi = variant.cauHoi.filter((q) => q.cloId !== last.id)
      })
    })
    course.piList.forEach((pi) => {
      pi.cloIds = pi.cloIds.filter((id) => id !== last.id)
    })
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(`CLO "${last.maClo}" không được đợt đánh giá nào đo.`)
  })

  it('cặp (đợt, CLO) lệch 2 chiều -> cảnh báo', () => {
    const course = mock()
    const q = firstGktQuestion(course)
    q.cloId = 'CLO5'
    const messages = warnings(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain(
      'Cặp đợt "GKT" – CLO "CLO5" có câu hỏi nhưng không có trong kế hoạch đánh giá.'
    )
  })

  it('tổng điểm tối đa mỗi đề phải bằng 10 -> lỗi khi lệch', () => {
    const course = mock()
    const q = firstGktQuestion(course)
    q.diemToiDa = 0.5
    const messages = errors(validateCourse(course)).map((i) => i.message)
    expect(messages).toContain('Tổng điểm tối đa của đề GKT/D1 = 10.25, phải bằng 10.')
  })

  it('đợt nhập trực tiếp DIRECT_CLO_SCORE không cần câu hỏi vẫn hợp lệ', () => {
    const course = mock()
    course.dotDanhGia[0].cachNhapDiem = 'DIRECT_CLO_SCORE'
    course.dotDanhGia[0].maDeList = []
    const errs = errors(validateCourse(course))
    expect(errs.filter((e) => e.scope === 'exam' || e.scope === 'assessment')).toHaveLength(0)
  })

  it('cảnh báo khi tỷ lệ điểm câu hỏi trong đề lệch so với kế hoạch', () => {
    const course = mock()
    // GKT: CLO1 và CLO2 đều có tyLePhanBo trong mock, sửa điểm câu của CLO1 để lệch tỷ lệ
    const msgs = warnings(validateCourse(course)).map((i) => i.message)
    // Sửa câu hỏi CLO1 điểm khác để tạo độ lệch tỷ lệ
    const gkt = course.dotDanhGia.find((d) => d.id === 'GKT')!
    const de1 = gkt.maDeList[0]
    de1.cauHoi[0].diemToiDa = 4
    de1.cauHoi[1].diemToiDa = 6
    const msgsWithSkew = warnings(validateCourse(course)).map((i) => i.message)
    expect(msgsWithSkew.some((m) => m.includes('lệch so với kế hoạch'))).toBe(true)
  })
})
