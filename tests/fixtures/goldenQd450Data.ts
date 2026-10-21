/**
 * Bộ dữ liệu kiểm thử chuẩn (Golden Test Data) trích xuất chính xác từ văn bản QĐ450/QĐ-ĐHTĐ
 * và các phụ lục đính kèm theo cập nhật tại Mục VI và VII của tài liệu đặc tả.
 */

import { DEFAULT_BUSINESS_RULES } from '@core/rules'
import type { CourseConfig, RawStudentRow } from '@core/types'

export const GOLDEN_T1 = {
  case1: { correct: 62, total: 100, expectedP: 0.62 },
  case2: { mean: 2.4, maxScore: 3, expectedP: 0.8 }
}

export const GOLDEN_T2 = {
  n: 15,
  groupSize: 4, // 27% của 15 làm tròn
  topCorrect: 4,
  bottomCorrect: 2,
  expectedD: 0.5
}

export const GOLDEN_T3 = {
  maxScore: 2,
  expectedD: 0.25
}

export const GOLDEN_T4 = {
  // Ma trận 15 SV x 5 câu (QĐ450 tr.7–8, Ví dụ 5)
  numStudents: 15,
  numQuestions: 5,
  questionMeans: [2.47, 2.37, 1.43, 0.67, 0.53],
  questionVariances: [0.1952, 0.1595, 0.1738, 0.1667, 0.1595],
  sumQuestionVariance: 0.8548,
  totalScoreVariance: 1.7667,
  expectedAlpha: 0.65, // 0.6452 làm tròn 2 chữ số

  // Ma trận điểm chi tiết 15 SV x 5 câu để test engine psychometrics trực tiếp
  // Cột: [C1, C2, C3, C4, C5] với max = [3, 3, 2, 1, 1]
  // Tổng TB = 2.47 + 2.37 + 1.43 + 0.67 + 0.53 = 7.47
  scores: [
    [3, 3, 2, 1, 1], // SV1
    [3, 3, 2, 1, 1], // SV2
    [3, 3, 2, 1, 1], // SV3
    [3, 3, 2, 1, 1], // SV4
    [3, 3, 2, 1, 0], // SV5
    [3, 2, 2, 1, 1], // SV6
    [2, 3, 1, 1, 1], // SV7
    [2, 2, 2, 1, 0], // SV8
    [2, 2, 1, 1, 1], // SV9
    [2, 2, 1, 0, 1], // SV10
    [2, 2, 1, 0, 0], // SV11
    [2, 2, 1, 0, 0], // SV12
    [2, 2, 1, 0, 0], // SV13
    [3, 2, 1, 0, 0], // SV14
    [2, 2, 0, 1, 0] // SV15
  ]
}

export const GOLDEN_HUNG = {
  // Sinh viên Nguyễn Văn Hùng (QĐ450 tr.32–33)
  studentInfo: {
    id: 'HUNG01',
    name: 'Nguyễn Văn Hùng'
  },
  // Điểm quá trình thành phần (T5)
  processScores: {
    cc: 10.0,
    tuHoc: 7.5,
    c_cc: 8.8, // TB nhóm CC (CLO3.1)
    c_gk: 6.7, // TB 6 CLO nhóm GK
    clo_quatrinh: {
      'CLO1.1': 7.5,
      'CLO1.2': 6.3,
      'CLO1.3': 7.3,
      'CLO1.4': 6.7,
      'CLO2.1': 5.0,
      'CLO2.2': 7.5,
      'CLO3.1': 8.8
    } as Record<string, number>
  },
  // Điểm thi cuối kỳ thành phần (T6)
  finalScores: {
    c_ck: 5.9, // TB 6 CLO nhóm CK
    clo_cuoiky: {
      'CLO1.1': 7.1,
      'CLO1.2': 6.0,
      'CLO1.3': 7.3,
      'CLO1.4': 5.0,
      'CLO2.1': 7.5,
      'CLO2.2': 2.5
    } as Record<string, number>
  },
  // CLO cả học phần (T7)
  courseClos: {
    'CLO1.1': 7.3,
    'CLO1.2': 6.1,
    'CLO1.3': 7.3,
    'CLO1.4': 5.6,
    'CLO2.1': 6.6,
    'CLO2.2': 4.4,
    'CLO3.1': 8.8
  } as Record<string, number>,
  expectedTbcClo: 6.6, // TBC CLO cả học phần (Phụ lục 3)

  // Điểm học phần theo QĐ450 (T8): 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
  expectedHpQd450: 6.7,

  // PLO thành phần (T9)
  expectedPlos: {
    PLO3: 6.6, // (7.3 + 6.1 + 7.3 + 5.6) / 4 = 6.575 -> 6.6
    PLO5: 6.6,
    PLO6: 4.4,
    PLO9: 8.8
  } as Record<string, number>,

  // Test 12: TB quá trình của Hùng: (8.8 + 6.7)/2 = 7.75 -> 7.8
  expectedTbQuaTrinh: 7.8
}

export const GOLDEN_ROUNDING = {
  // Test T10: Làm tròn nửa lên (ROUND_HALF_UP)
  cases: [
    { input: 6.25, expected: 6.3 },
    { input: 8.75, expected: 8.8 }
  ]
}

export const GOLDEN_T11 = {
  // Mẫu xls: KT1 câu 2 (2/5 = 4.0), KT2 câu 1 (3/4 = 7.5)
  // CLO2 = (4.0 + 7.5)/2 = 5.75 -> 5.8 (chế độ chain)
  expectedClo2: 5.8
}

/**
 * Cấu hình học phần chuẩn để test dữ liệu SV Nguyễn Văn Hùng
 */
export const HUNG_COURSE_CONFIG: CourseConfig = {
  courseInfo: {
    maHp: 'KTLT101',
    tenHp: 'Kỹ thuật lập trình',
    soTinChi: 3,
    hinhThucThi: 'Tự luận',
    loaiHp: 'thuong'
  },
  cloList: [
    { maClo: 'CLO1.1', noiDung: 'Hiểu cấu trúc dữ liệu', bacNangLuc: '3/6' },
    { maClo: 'CLO1.2', noiDung: 'Cài đặt thuật toán', bacNangLuc: '3/6' },
    { maClo: 'CLO1.3', noiDung: 'Tối ưu giải thuật', bacNangLuc: '4/6' },
    { maClo: 'CLO1.4', noiDung: 'Kiểm thử chương trình', bacNangLuc: '3/6' },
    { maClo: 'CLO2.1', noiDung: 'Làm việc nhóm', bacNangLuc: '3/5' },
    { maClo: 'CLO2.2', noiDung: 'Thuyết trình kỹ thuật', bacNangLuc: '3/5' },
    { maClo: 'CLO3.1', noiDung: 'Chuyên cần, tự học', bacNangLuc: '3/5' }
  ],
  keHoachDanhGia: [
    // CC (20%): CC đo CLO3.1 (10%), TH đo CLO3.1 (10%)
    { nhom: 'CC', thanhPhan: 'Chuyên cần', maDauDiem: 'CC', clo: 'CLO3.1', trongSoPhanTram: 10 },
    { nhom: 'CC', thanhPhan: 'Tự học', maDauDiem: 'TH', clo: 'CLO3.1', trongSoPhanTram: 10 },
    // GK (30%): Trọng số của lần đo GK với các CLO là 0.3 (30%)
    { nhom: 'GK', thanhPhan: 'KT1', maDauDiem: 'KT1', clo: 'CLO1.1', trongSoPhanTram: 30 },
    { nhom: 'GK', thanhPhan: 'KT1', maDauDiem: 'KT1', clo: 'CLO1.2', trongSoPhanTram: 30 },
    { nhom: 'GK', thanhPhan: 'KT1', maDauDiem: 'KT1', clo: 'CLO1.3', trongSoPhanTram: 30 },
    { nhom: 'GK', thanhPhan: 'KT2', maDauDiem: 'KT2', clo: 'CLO1.4', trongSoPhanTram: 30 },
    { nhom: 'GK', thanhPhan: 'KT2', maDauDiem: 'KT2', clo: 'CLO2.1', trongSoPhanTram: 30 },
    { nhom: 'GK', thanhPhan: 'KT2', maDauDiem: 'KT2', clo: 'CLO2.2', trongSoPhanTram: 30 },
    // CK (50%): Trọng số của lần đo CK với các CLO là 0.5 (50%)
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO1.1', trongSoPhanTram: 50 },
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO1.2', trongSoPhanTram: 50 },
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO1.3', trongSoPhanTram: 50 },
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO1.4', trongSoPhanTram: 50 },
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO2.1', trongSoPhanTram: 50 },
    { nhom: 'CK', thanhPhan: 'CK', maDauDiem: 'CK', clo: 'CLO2.2', trongSoPhanTram: 50 }
  ],
  cauHoi: [
    { maCotDiem: 'CC', maDauDiem: 'CC', cau: 'CC', clo: 'CLO3.1', diemToiDa: 10 },
    { maCotDiem: 'TH', maDauDiem: 'TH', cau: 'TH', clo: 'CLO3.1', diemToiDa: 10 },
    { maCotDiem: 'KT1_1.1', maDauDiem: 'KT1', cau: 'C1', clo: 'CLO1.1', diemToiDa: 10 },
    { maCotDiem: 'KT1_1.2', maDauDiem: 'KT1', cau: 'C2', clo: 'CLO1.2', diemToiDa: 10 },
    { maCotDiem: 'KT1_1.3', maDauDiem: 'KT1', cau: 'C3', clo: 'CLO1.3', diemToiDa: 10 },
    { maCotDiem: 'KT2_1.4', maDauDiem: 'KT2', cau: 'C1', clo: 'CLO1.4', diemToiDa: 10 },
    { maCotDiem: 'KT2_2.1', maDauDiem: 'KT2', cau: 'C2', clo: 'CLO2.1', diemToiDa: 10 },
    { maCotDiem: 'KT2_2.2', maDauDiem: 'KT2', cau: 'C3', clo: 'CLO2.2', diemToiDa: 10 },
    { maCotDiem: 'CK_1.1', maDauDiem: 'CK', cau: 'C1', clo: 'CLO1.1', diemToiDa: 10 },
    { maCotDiem: 'CK_1.2', maDauDiem: 'CK', cau: 'C2', clo: 'CLO1.2', diemToiDa: 10 },
    { maCotDiem: 'CK_1.3', maDauDiem: 'CK', cau: 'C3', clo: 'CLO1.3', diemToiDa: 10 },
    { maCotDiem: 'CK_1.4', maDauDiem: 'CK', cau: 'C4', clo: 'CLO1.4', diemToiDa: 10 },
    { maCotDiem: 'CK_2.1', maDauDiem: 'CK', cau: 'C5', clo: 'CLO2.1', diemToiDa: 10 },
    { maCotDiem: 'CK_2.2', maDauDiem: 'CK', cau: 'C6', clo: 'CLO2.2', diemToiDa: 10 }
  ],
  maTranPlo: [
    { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO1.1' },
    { plo: 'PLO3', pi: 'PI3.1', clo: 'CLO1.2' },
    { plo: 'PLO3', pi: 'PI3.2', clo: 'CLO1.3' },
    { plo: 'PLO3', pi: 'PI3.2', clo: 'CLO1.4' },
    { plo: 'PLO5', pi: 'PI5.1', clo: 'CLO2.1' },
    { plo: 'PLO6', pi: 'PI6.1', clo: 'CLO2.2' },
    { plo: 'PLO9', pi: 'PI9.1', clo: 'CLO3.1' }
  ],
  quyTac: DEFAULT_BUSINESS_RULES
}

/**
 * Hàng điểm thô của SV Nguyễn Văn Hùng
 */
export const HUNG_STUDENT_ROW: RawStudentRow = {
  tt: 1,
  maSv: 'HUNG01',
  hoTen: 'Nguyễn Văn Hùng',
  ngaySinh: '01/01/2004',
  diemCacCot: {
    CC: 10.0,
    TH: 7.5,
    'KT1_1.1': 7.5,
    'KT1_1.2': 6.3,
    'KT1_1.3': 7.3,
    'KT2_1.4': 6.7,
    'KT2_2.1': 5.0,
    'KT2_2.2': 7.5,
    'CK_1.1': 7.1,
    'CK_1.2': 6.0,
    'CK_1.3': 7.3,
    'CK_1.4': 5.0,
    'CK_2.1': 7.5,
    'CK_2.2': 2.5
  }
}
