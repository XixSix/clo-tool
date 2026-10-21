/**
 * Bộ dữ liệu kiểm thử chuẩn (Golden Test Data) trích xuất chính xác từ văn bản QĐ450/QĐ-ĐHTĐ
 * và các phụ lục đính kèm theo cập nhật tại Mục VI và VII của tài liệu đặc tả.
 */

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
  expectedAlpha: 0.65 // 0.6452 làm tròn 2 chữ số
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
    }
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
    }
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
  },
  expectedTbcClo: 6.6, // TBC CLO cả học phần (Phụ lục 3)

  // Điểm học phần theo QĐ450 (T8): 0.2*8.8 + 0.3*6.7 + 0.5*5.9 = 6.72 -> 6.7
  expectedHpQd450: 6.7,

  // PLO thành phần (T9)
  expectedPlos: {
    PLO3: 6.6, // (7.3 + 6.1 + 7.3 + 5.6) / 4 = 6.575 -> 6.6
    PLO5: 6.6,
    PLO6: 4.4,
    PLO9: 8.8
  },

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
