/**
 * Dữ liệu MOCK cho một lớp học phần thực tế (dùng để test end-to-end, chạy demo và sinh template).
 *
 * Học phần KTLT101 – 4 CLO (CLO2–CLO5), trọng số nhóm 20/30/50, điểm danh 12 buổi.
 *
 * Cấu trúc đề đa dạng:
 * - GK gồm 2 đề: GKT (trắc nghiệm, 2 câu cùng đo CLO3, max 6 + 4) và GTX (tự luận,
 *   2 câu đo CLO4 + CLO5, max 4 + 6)
 * - CK: 1 đề tự luận 4 câu, mỗi câu 1 CLO
 * - CC + Thái độ (TD) đo 3 CLO còn lại → tổng trọng số 100%
 *
 * 10 sinh viên ĐẦU TIÊN là dữ liệu CỐ ĐỊNH, mỗi SV đại diện một ca biên:
 * - SV0: mã bắt đầu bằng số 0 (phải giữ nguyên dạng văn bản), dữ liệu đầy đủ (baseline)
 * - SV1: đầy đủ, điểm lẻ .25/.75 để kiểm làm tròn
 * - SV2: đạt gần điểm tối đa mọi cột
 * - SV3: điểm yếu (nhiều CLO dưới ngưỡng 4.0)
 * - SV4: vắng thi cuối kỳ (VT toàn bộ cột CK)
 * - SV5: chuyên cần kém (nhiều buổi V/M/V-CP)
 * - SV6: thiếu một phần điểm (câu 2 đề GK TN và câu 2 đề GK TL trống)
 * - SV7: chưa nhập điểm nào (kể cả Ngày sinh), chưa có kết quả đánh giá
 * - SV8: có ghi chú "Sinh viên học lại"
 * - SV9: thi đủ nhưng 1 câu CK = 0 điểm, có 1 buổi vắng có phép
 *
 * Sinh viên vượt quá 10 được sinh giả ngẫu nhiên có seed (không mang ca biên).
 * Template phát hành chỉ dùng đúng 10 SV này (xem scripts/gen-templates.ts).
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
        noiDung: 'Giải thích các khái niệm lập trình và áp dụng cú pháp ngôn ngữ C',
        bacNangLuc: '3/6',
        trongSoClo: 1
      },
      {
        maClo: 'CLO3',
        noiDung: 'Vận dụng cấu trúc dữ liệu và giải thuật để giải quyết bài toán',
        bacNangLuc: '3/6',
        trongSoClo: 1
      },
      {
        maClo: 'CLO4',
        noiDung: 'Thiết kế, cài đặt và kiểm thử chương trình',
        bacNangLuc: '3/5',
        trongSoClo: 1
      },
      {
        maClo: 'CLO5',
        noiDung: 'Làm việc nhóm, thuyết trình và ý thức trách nhiệm nghề nghiệp',
        bacNangLuc: '4/6',
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
        clo: 'CLO5',
        trongSoPhanTram: 10,
        hinhThuc: 'Quan sát trên lớp',
        thoiDiem: 'Suốt kỳ'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra giữa kỳ – đề trắc nghiệm',
        maDauDiem: 'GKT',
        clo: 'CLO3',
        trongSoPhanTram: 15,
        hinhThuc: 'Trắc nghiệm (2 câu cùng CLO3)',
        thoiDiem: 'Tuần 6'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra giữa kỳ – đề tự luận',
        maDauDiem: 'GTX',
        clo: 'CLO4',
        trongSoPhanTram: 10,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Tuần 6'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra giữa kỳ – đề tự luận',
        maDauDiem: 'GTX',
        clo: 'CLO5',
        trongSoPhanTram: 5,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Tuần 6'
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
        trongSoPhanTram: 10,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Cuối kỳ'
      },
      {
        nhom: 'CK',
        thanhPhan: 'Thi kết thúc học phần',
        maDauDiem: 'CK',
        clo: 'CLO4',
        trongSoPhanTram: 10,
        hinhThuc: 'Tự luận',
        thoiDiem: 'Cuối kỳ'
      },
      {
        nhom: 'CK',
        thanhPhan: 'Thi kết thúc học phần',
        maDauDiem: 'CK',
        clo: 'CLO5',
        trongSoPhanTram: 10,
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
        clo: 'CLO5',
        diemToiDa: 10,
        maDe: 'ALL',
        loai: 'TL'
      },
      // Đề GK trắc nghiệm (D1): 2 câu CÙNG đo CLO3 — ví dụ "2 câu cùng 1 CLO", tổng 10 điểm
      {
        maCotDiem: 'GKT_C1',
        maDauDiem: 'GKT',
        cau: 'Câu 1',
        clo: 'CLO3',
        diemToiDa: 6,
        maDe: 'D1',
        loai: 'TN'
      },
      {
        maCotDiem: 'GKT_C2',
        maDauDiem: 'GKT',
        cau: 'Câu 2',
        clo: 'CLO3',
        diemToiDa: 4,
        maDe: 'D1',
        loai: 'TN'
      },
      // Đề GK tự luận (D2): 2 câu khác CLO, điểm tối đa không đều
      {
        maCotDiem: 'GTX_C1',
        maDauDiem: 'GTX',
        cau: 'Câu 1',
        clo: 'CLO4',
        diemToiDa: 4,
        maDe: 'D2',
        loai: 'TL'
      },
      {
        maCotDiem: 'GTX_C2',
        maDauDiem: 'GTX',
        cau: 'Câu 2',
        clo: 'CLO5',
        diemToiDa: 6,
        maDe: 'D2',
        loai: 'TL'
      },
      // Đề CK (D3): 1 đề tự luận 4 câu, mỗi câu 1 CLO
      {
        maCotDiem: 'CK_C1',
        maDauDiem: 'CK',
        cau: 'Câu 1',
        clo: 'CLO2',
        diemToiDa: 3,
        maDe: 'D3',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C2',
        maDauDiem: 'CK',
        cau: 'Câu 2',
        clo: 'CLO3',
        diemToiDa: 2.5,
        maDe: 'D3',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C3',
        maDauDiem: 'CK',
        cau: 'Câu 3',
        clo: 'CLO4',
        diemToiDa: 2.5,
        maDe: 'D3',
        loai: 'TL'
      },
      {
        maCotDiem: 'CK_C4',
        maDauDiem: 'CK',
        cau: 'Câu 4',
        clo: 'CLO5',
        diemToiDa: 2,
        maDe: 'D3',
        loai: 'TL'
      }
    ],
    maTranPlo: [
      { plo: 'PLO2', pi: 'PI2.1', clo: 'CLO2' },
      { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO3' },
      { plo: 'PLO3', pi: 'PI3.2', clo: 'CLO4' },
      { plo: 'PLO4', pi: 'PI4.1', clo: 'CLO5' }
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

/** Đặc tả 1 sinh viên mẫu cố định */
interface CuratedStudentSpec {
  maSv: string
  hoTen: string
  ngaySinh?: string
  ghiChu?: string
  /** 12 ký hiệu điểm danh, theo thứ tự MOCK_SESSION_LABELS (Buổi 1 → Buổi 12) */
  diemDanh: string[]
  /** Điểm các cột; CC tự tính từ điểm danh nên không khai báo ở đây */
  diemCacCot: RawStudentRow['diemCacCot']
}

/**
 * 10 sinh viên mẫu cố định, mỗi SV một ca biên (xem header file).
 * Điểm chọn sẵn bậc 0.25, giá trị cố định để kết quả tính được đối chiếu dễ dàng.
 */
const CURATED_STUDENTS: CuratedStudentSpec[] = [
  {
    // SV0 – baseline: đầy đủ thông tin, mã SV có số 0 ở đầu
    maSv: '0123456789',
    hoTen: 'Nguyễn Văn Đạt',
    ngaySinh: '01/01/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'OL', 'M'],
    diemCacCot: {
      TD: 8.5,
      GKT_C1: 4.5,
      GKT_C2: 3,
      GTX_C1: 2.75,
      GTX_C2: 5,
      CK_C1: 2.25,
      CK_C2: 2,
      CK_C3: 1.25,
      CK_C4: 1.25
    }
  },
  {
    // SV1 – đầy đủ, điểm lẻ .25/.75 để kiểm làm tròn
    maSv: '2311100011',
    hoTen: 'Trần Thị Hạnh',
    ngaySinh: '05/03/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'M'],
    diemCacCot: {
      TD: 7.75,
      GKT_C1: 5,
      GKT_C2: 3.5,
      GTX_C1: 3.25,
      GTX_C2: 4.25,
      CK_C1: 2.75,
      CK_C2: 1.75,
      CK_C3: 1.5,
      CK_C4: 1
    }
  },
  {
    // SV2 – đạt gần điểm tối đa mọi cột (có cột đạt tối đa tuyệt đối)
    maSv: '2311100012',
    hoTen: 'Lê Minh Hải',
    ngaySinh: '12/07/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    diemCacCot: {
      TD: 10,
      GKT_C1: 6,
      GKT_C2: 4,
      GTX_C1: 4,
      GTX_C2: 6,
      CK_C1: 3,
      CK_C2: 2.5,
      CK_C3: 2.5,
      CK_C4: 2
    }
  },
  {
    // SV3 – điểm yếu, nhiều CLO dưới ngưỡng Đạt 4.0
    maSv: '2311100013',
    hoTen: 'Phạm Thu Chi',
    ngaySinh: '21/09/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'V-CP', 'V', 'M'],
    diemCacCot: {
      TD: 3.5,
      GKT_C1: 1.5,
      GKT_C2: 1,
      GTX_C1: 1,
      GTX_C2: 1.5,
      CK_C1: 1,
      CK_C2: 0.75,
      CK_C3: 0.75,
      CK_C4: 0.75
    }
  },
  {
    // SV4 – vắng thi cuối kỳ: toàn bộ cột CK = VT
    maSv: '2311100014',
    hoTen: 'Hoàng Văn Dũng',
    ngaySinh: '08/11/2004',
    ghiChu: 'Vắng thi cuối kỳ',
    diemDanh: ['X', 'X', 'X', 'V', 'X', 'V-CP', 'X', 'V', 'X', 'X', 'X', 'X'],
    diemCacCot: {
      TD: 6.5,
      GKT_C1: 3,
      GKT_C2: 2,
      GTX_C1: 2,
      GTX_C2: 3,
      CK_C1: 'VT',
      CK_C2: 'VT',
      CK_C3: 'VT',
      CK_C4: 'VT'
    }
  },
  {
    // SV5 – chuyên cần kém: nhiều buổi V / M / V-CP
    maSv: '2311100015',
    hoTen: 'Vũ Ngọc Hà',
    ngaySinh: '17/02/2005',
    diemDanh: ['M', 'V', 'X', 'V', 'M', 'V-CP', 'M', 'V', 'X', 'OL', 'V', 'M'],
    diemCacCot: {
      TD: 5,
      GKT_C1: 4.5,
      GKT_C2: 2.5,
      GTX_C1: 2.5,
      GTX_C2: 3.75,
      CK_C1: 2,
      CK_C2: 1.5,
      CK_C3: 1.5,
      CK_C4: 1
    }
  },
  {
    // SV6 – thiếu một phần điểm: câu 2 đề GK TN và câu 2 đề GK TL trống
    maSv: '2311100016',
    hoTen: 'Bùi Minh Đức',
    ngaySinh: '03/04/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'OL'],
    diemCacCot: {
      TD: 8,
      GKT_C1: 4.5,
      GKT_C2: null,
      GTX_C1: 3.5,
      GTX_C2: null,
      CK_C1: 2.75,
      CK_C2: 2,
      CK_C3: 1.75,
      CK_C4: 1.75
    }
  },
  {
    // SV7 – chưa nhập điểm nào (kể cả Ngày sinh): thiếu dữ liệu hàng loạt
    maSv: '2311100017',
    hoTen: 'Đỗ Hữu Giang',
    ngaySinh: undefined,
    diemDanh: ['OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL'],
    diemCacCot: {
      TD: null,
      GKT_C1: null,
      GKT_C2: null,
      GTX_C1: null,
      GTX_C2: null,
      CK_C1: null,
      CK_C2: null,
      CK_C3: null,
      CK_C4: null
    }
  },
  {
    // SV8 – có ghi chú "Sinh viên học lại", điểm trung bình khá
    maSv: '2311100018',
    hoTen: 'Đặng Ngọc Hùng',
    ngaySinh: '30/10/2004',
    ghiChu: 'Sinh viên học lại',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'M', 'X', 'M'],
    diemCacCot: {
      TD: 6,
      GKT_C1: 3.5,
      GKT_C2: 2.5,
      GTX_C1: 2.25,
      GTX_C2: 3.5,
      CK_C1: 2,
      CK_C2: 1.5,
      CK_C3: 1.5,
      CK_C4: 1.5
    }
  },
  {
    // SV9 – thi đủ cột nhưng 1 câu CK = 0 điểm; có 1 buổi vắng có phép
    maSv: '2311100019',
    hoTen: 'Bùi Quang Tuấn',
    ngaySinh: '14/08/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'V-CP'],
    diemCacCot: {
      TD: 9,
      GKT_C1: 5.5,
      GKT_C2: 4,
      GTX_C1: 3.75,
      GTX_C2: 5.5,
      CK_C1: 2.75,
      CK_C2: 2,
      CK_C3: 0.5,
      CK_C4: 0
    }
  }
]

/**
 * Sinh dữ liệu lớp mock.
 * - 10 SV đầu: dữ liệu cố định theo CURATED_STUDENTS (mỗi SV một ca biên).
 * - Từ SV11 trở đi: sinh giả ngẫu nhiên có seed (điểm hợp lệ, không mang ca biên).
 *   Dùng chủ yếu cho test end-to-end cần lớp lớn hơn 10.
 */
export function buildMockClass(studentCount = 10): MockClassData {
  const random = createRandom(4502024)
  const students: RawStudentRow[] = []
  const attendance: Record<string, Record<string, string>> = {}

  for (let i = 0; i < studentCount; i++) {
    const maSv = i === 0 ? '0123456789' : `2311${String(100010 + i).padStart(6, '0')}`

    // 10 SV đầu: dữ liệu cố định
    if (i < CURATED_STUDENTS.length) {
      const spec = CURATED_STUDENTS[i]
      students.push({
        tt: i + 1,
        maSv: spec.maSv,
        hoTen: spec.hoTen,
        ngaySinh: spec.ngaySinh,
        diemCacCot: spec.diemCacCot,
        maDe: 'ALL',
        ghiChu: spec.ghiChu
      })
      attendance[maSv] = Object.fromEntries(
        MOCK_SESSION_LABELS.map((label, idx) => [label, spec.diemDanh[idx]])
      )
      continue
    }

    // Các SV còn lại: sinh giả ngẫu nhiên, dữ liệu luôn đầy đủ
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
      GKT_C1: quarter(clamp((ability / 10) * 6 + (random() - 0.5) * 1.2, 0, 6)),
      GKT_C2: quarter(clamp((ability / 10) * 4 + (random() - 0.5) * 0.8, 0, 4)),
      GTX_C1: quarter(clamp((ability / 10) * 4 + (random() - 0.5) * 1.6, 0, 4)),
      GTX_C2: quarter(clamp((ability / 10) * 6 + (random() - 0.5) * 1.6, 0, 6)),
      CK_C1: quarter(clamp((ability / 10) * 3 + (random() - 0.5) * 1.5, 0, 3)),
      CK_C2: quarter(clamp((ability / 10) * 2.5 + (random() - 0.5) * 1, 0, 2.5)),
      CK_C3: quarter(clamp((ability / 10) * 2.5 + (random() - 0.5) * 1, 0, 2.5)),
      CK_C4: quarter(clamp((ability / 10) * 2 + (random() - 0.5) * 0.8, 0, 2))
    }

    students.push({
      tt: i + 1,
      maSv,
      hoTen,
      ngaySinh: `${String((i % 28) + 1).padStart(2, '0')}/${String((i % 12) + 1).padStart(2, '0')}/2005`,
      diemCacCot,
      maDe: 'ALL',
      ghiChu: undefined
    })
  }

  return { students, attendance }
}
