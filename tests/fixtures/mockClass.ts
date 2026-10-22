/**
 * Dữ liệu MOCK cho một lớp học phần thực tế (dùng để test end-to-end và chạy demo).
 *
 * Học phần KTLT101 – 3 CLO (CLO2, CLO3, CLO4), trọng số 20/30/50,
 * có điểm danh 12 buổi, 32 sinh viên, gồm các ca biên:
 * - Mã SV bắt đầu bằng số 0 (phải giữ nguyên dạng văn bản)
 * - 1 SV vắng thi cuối kỳ (VT)
 * - 1 SV còn ô điểm trống
 * - Điểm lẻ 0,25
 */

import type { CourseConfig, RawStudentRow } from '@core/types'
import { DEFAULT_BUSINESS_RULES } from '@core/rules'

export const MOCK_SESSION_LABELS = Array.from({ length: 12 }, (_, i) => `Buổi ${i + 1}`)

export function buildMockConfig(): CourseConfig {
  return {
    courseInfo: {
      maHp: 'KTLT101',
      tenHp: 'Kỹ thuật lập trình',
      soTinChi: 3,
      hinhThucThi: 'Tự luận',
      loaiHp: 'thuong'
    },
    cloList: [
      {
        maClo: 'CLO2',
        noiDung: 'Vận dụng cấu trúc dữ liệu và giải thuật để giải quyết bài toán',
        bacNangLuc: '3/6',
        trongSoClo: 1
      },
      {
        maClo: 'CLO3',
        noiDung: 'Thiết kế, cài đặt và kiểm thử chương trình',
        bacNangLuc: '3/5',
        trongSoClo: 1
      },
      {
        maClo: 'CLO4',
        noiDung: 'Làm việc nhóm, thuyết trình và ý thức trách nhiệm nghề nghiệp',
        bacNangLuc: '3/5',
        trongSoClo: 1
      }
    ],
    keHoachDanhGia: [
      {
        nhom: 'CC',
        thanhPhan: 'Điểm danh chuyên cần',
        maDauDiem: 'CC',
        clo: 'CLO2',
        trongSoPhanTram: 5,
        hinhThuc: 'Điểm danh',
        thoiDiem: 'Suốt kỳ'
      },
      {
        nhom: 'CC',
        thanhPhan: 'Điểm danh chuyên cần',
        maDauDiem: 'CC',
        clo: 'CLO3',
        trongSoPhanTram: 5,
        hinhThuc: 'Điểm danh',
        thoiDiem: 'Suốt kỳ'
      },
      {
        nhom: 'CC',
        thanhPhan: 'Thái độ học tập',
        maDauDiem: 'TD',
        clo: 'CLO4',
        trongSoPhanTram: 10,
        hinhThuc: 'Quan sát trên lớp',
        thoiDiem: 'Suốt kỳ'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra định kỳ CLO3',
        maDauDiem: 'KT3',
        clo: 'CLO3',
        trongSoPhanTram: 15,
        hinhThuc: 'Thực hành',
        thoiDiem: 'Tuần 6'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra định kỳ CLO4',
        maDauDiem: 'KT4',
        clo: 'CLO4',
        trongSoPhanTram: 15,
        hinhThuc: 'Thực hành',
        thoiDiem: 'Tuần 10'
      },
      {
        nhom: 'CK',
        thanhPhan: 'Thi kết thúc học phần',
        maDauDiem: 'CK',
        clo: 'CLO2',
        trongSoPhanTram: 20,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Cuối kỳ'
      },
      {
        nhom: 'CK',
        thanhPhan: 'Thi kết thúc học phần',
        maDauDiem: 'CK',
        clo: 'CLO3',
        trongSoPhanTram: 15,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Cuối kỳ'
      },
      {
        nhom: 'CK',
        thanhPhan: 'Thi kết thúc học phần',
        maDauDiem: 'CK',
        clo: 'CLO4',
        trongSoPhanTram: 15,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Cuối kỳ'
      }
    ],
    cauHoi: [
      {
        maCotDiem: 'CC',
        maDauDiem: 'CC',
        cau: 'CC',
        clo: 'CLO2',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'CC',
        maDauDiem: 'CC',
        cau: 'CC',
        clo: 'CLO3',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'TD',
        maDauDiem: 'TD',
        cau: 'TD',
        clo: 'CLO4',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'KT3',
        maDauDiem: 'KT3',
        cau: 'Câu 1',
        clo: 'CLO3',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'KT4',
        maDauDiem: 'KT4',
        cau: 'Câu 1',
        clo: 'CLO4',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C2',
        maDauDiem: 'CK',
        cau: 'Câu 1',
        clo: 'CLO2',
        diemToiDa: 4,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C3',
        maDauDiem: 'CK',
        cau: 'Câu 2',
        clo: 'CLO3',
        diemToiDa: 3,
        maDe: 'ALL',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C4',
        maDauDiem: 'CK',
        cau: 'Câu 3',
        clo: 'CLO4',
        diemToiDa: 3,
        maDe: 'ALL',
        loai: 'TL'
      }
    ],
    maTranPlo: [
      { plo: 'PLO2', pi: 'PI2.1', clo: 'CLO2' },
      { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO3' },
      { plo: 'PLO4', pi: 'PI4.1', clo: 'CLO4' }
    ],
    diemDanh: [
      { kyHieu: 'X', heSo: 1, dienGiai: 'Có mặt đúng giờ' },
      { kyHieu: 'OL', heSo: 1, dienGiai: 'Học online có mặt' },
      { kyHieu: 'M', heSo: 0.5, dienGiai: 'Đi muộn hoặc về sớm' },
      { kyHieu: 'V-CP', heSo: 0.5, dienGiai: 'Vắng có phép' },
      { kyHieu: 'V', heSo: 0, dienGiai: 'Vắng không phép' }
    ],
    quyTac: { ...DEFAULT_BUSINESS_RULES }
  }
}

/** Bộ sinh số giả ngẫu nhiên có seed để dữ liệu test luôn ổn định */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function quarter(value: number): number {
  return Math.round(value * 4) / 4
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['Anh', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hùng', 'Lan']
const TEN_DEM = ['Văn', 'Thị', 'Minh', 'Quang', 'Thu', 'Đức', 'Ngọc', 'Hữu']

export interface MockClassData {
  students: RawStudentRow[]
  attendance: Record<string, Record<string, string>>
}

export function buildMockClass(studentCount = 32): MockClassData {
  const random = createRandom(4502024)
  const students: RawStudentRow[] = []
  const attendance: Record<string, Record<string, string>> = {}

  for (let i = 0; i < studentCount; i++) {
    const maSv = i === 0 ? '0123456789' : `2311${String(100010 + i).padStart(6, '0')}`
    const hoTen = `${HO[i % HO.length]} ${TEN_DEM[i % TEN_DEM.length]} ${TEN[i % TEN.length]}`
    const ability = 3.5 + random() * 6 // 3.5 – 9.5

    // Điểm danh 12 buổi
    const symbols: Record<string, string> = {}
    for (const label of MOCK_SESSION_LABELS) {
      const roll = random()
      const good = ability / 10
      if (roll < 0.05) symbols[label] = 'V'
      else if (roll < 0.1) symbols[label] = 'V-CP'
      else if (roll < 0.18) symbols[label] = 'M'
      else if (roll < 0.3) symbols[label] = 'OL'
      else symbols[label] = good > 0.4 ? 'X' : roll < 0.6 ? 'OL' : 'M'
    }
    attendance[maSv] = symbols

    const diemCacCot: RawStudentRow['diemCacCot'] = {
      TD: quarter(clamp(ability + (random() - 0.5) * 2, 0, 10)),
      KT3: quarter(clamp(ability + (random() - 0.5) * 3, 0, 10)),
      KT4: quarter(clamp(ability + (random() - 0.5) * 3, 0, 10)),
      CK_C2: quarter(clamp((ability / 10) * 4 + (random() - 0.5) * 1.5, 0, 4)),
      CK_C3: quarter(clamp((ability / 10) * 3 + (random() - 0.5) * 1.2, 0, 3)),
      CK_C4: quarter(clamp((ability / 10) * 3 + (random() - 0.5) * 1.2, 0, 3))
    }

    // Ca biên
    if (i === 4) {
      diemCacCot.CK_C2 = 'VT'
      diemCacCot.CK_C3 = 'VT'
      diemCacCot.CK_C4 = 'VT'
    }
    if (i === 6) {
      diemCacCot.KT4 = null
      diemCacCot.CK_C3 = null
    }

    students.push({
      tt: i + 1,
      maSv,
      hoTen,
      ngaySinh: `${String((i % 28) + 1).padStart(2, '0')}/${String((i % 12) + 1).padStart(2, '0')}/2005`,
      diemCacCot,
      maDe: 'ALL',
      ghiChu: i === 9 ? 'Sinh viên học lại' : undefined
    })
  }

  return { students, attendance }
}
