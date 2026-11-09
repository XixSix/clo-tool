/**
 * Bộ dữ liệu kiểm thử chuẩn (Golden Test Data) trích xuất chính xác từ văn bản QĐ450/QĐ-ĐHTĐ
 * và các phụ lục đính kèm theo cập nhật tại Mục VI và VII của tài liệu đặc tả.
 */

import { DEFAULT_BUSINESS_RULES } from '@core/rules'
import type {
  AssessmentComponent,
  Course,
  ExamQuestion,
  RawStudentRow,
  StudentCourseScoreRecord
} from '@core/types'

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

const HUNG_CLO = [
  { id: 'CLO1.1', maClo: 'CLO1.1', noiDung: 'Hiểu cấu trúc dữ liệu', bacNangLuc: '3/6' },
  { id: 'CLO1.2', maClo: 'CLO1.2', noiDung: 'Cài đặt thuật toán', bacNangLuc: '3/6' },
  { id: 'CLO1.3', maClo: 'CLO1.3', noiDung: 'Tối ưu giải thuật', bacNangLuc: '4/6' },
  { id: 'CLO1.4', maClo: 'CLO1.4', noiDung: 'Kiểm thử chương trình', bacNangLuc: '3/6' },
  { id: 'CLO2.1', maClo: 'CLO2.1', noiDung: 'Làm việc nhóm', bacNangLuc: '3/5' },
  { id: 'CLO2.2', maClo: 'CLO2.2', noiDung: 'Thuyết trình kỹ thuật', bacNangLuc: '3/5' },
  { id: 'CLO3.1', maClo: 'CLO3.1', noiDung: 'Chuyên cần, tự học', bacNangLuc: '3/5' }
]

function hungQuestion(id: string, cau: string, cloId: string): ExamQuestion {
  return { id, cau, diemToiDa: 10, cloId }
}

const KT1_DOT: AssessmentComponent = {
  id: 'KT1',
  tenDotDanhGia: 'Kiểm tra 1',
  nhom: 'GK',
  cachNhapDiem: 'QUESTION_SCORE',
  // Trọng số gốc 30% cho mỗi CLO, chuẩn hóa về 18% trên tổng 100%
  trongSoPhanTram: 18,
  cloList: [
    { cloId: 'CLO1.1', tyLePhanBo: 100 / 3 },
    { cloId: 'CLO1.2', tyLePhanBo: 100 / 3 },
    { cloId: 'CLO1.3', tyLePhanBo: 100 / 3 }
  ],
  maDeList: [
    {
      id: 'KT1_D1',
      maDe: 'D1',
      cauHoi: [
        hungQuestion('KT1_1.1', 'C1', 'CLO1.1'),
        hungQuestion('KT1_1.2', 'C2', 'CLO1.2'),
        hungQuestion('KT1_1.3', 'C3', 'CLO1.3')
      ]
    }
  ]
}

const KT2_DOT: AssessmentComponent = {
  id: 'KT2',
  tenDotDanhGia: 'Kiểm tra 2',
  nhom: 'GK',
  cachNhapDiem: 'QUESTION_SCORE',
  trongSoPhanTram: 18,
  cloList: [
    { cloId: 'CLO1.4', tyLePhanBo: 100 / 3 },
    { cloId: 'CLO2.1', tyLePhanBo: 100 / 3 },
    { cloId: 'CLO2.2', tyLePhanBo: 100 / 3 }
  ],
  maDeList: [
    {
      id: 'KT2_D1',
      maDe: 'D1',
      cauHoi: [
        hungQuestion('KT2_1.4', 'C1', 'CLO1.4'),
        hungQuestion('KT2_2.1', 'C2', 'CLO2.1'),
        hungQuestion('KT2_2.2', 'C3', 'CLO2.2')
      ]
    }
  ]
}

const CK_DOT: AssessmentComponent = {
  id: 'CK',
  tenDotDanhGia: 'Thi kết thúc học phần',
  nhom: 'CK',
  cachNhapDiem: 'QUESTION_SCORE',
  trongSoPhanTram: 60,
  cloList: ['CLO1.1', 'CLO1.2', 'CLO1.3', 'CLO1.4', 'CLO2.1', 'CLO2.2'].map((cloId) => ({
    cloId,
    tyLePhanBo: 100 / 6
  })),
  maDeList: [
    {
      id: 'CK_D1',
      maDe: 'D1',
      cauHoi: [
        hungQuestion('CK_1.1', 'C1', 'CLO1.1'),
        hungQuestion('CK_1.2', 'C2', 'CLO1.2'),
        hungQuestion('CK_1.3', 'C3', 'CLO1.3'),
        hungQuestion('CK_1.4', 'C4', 'CLO1.4'),
        hungQuestion('CK_2.1', 'C5', 'CLO2.1'),
        hungQuestion('CK_2.2', 'C6', 'CLO2.2')
      ]
    }
  ]
}

/**
 * Cấu hình học phần chuẩn để test dữ liệu SV Nguyễn Văn Hùng.
 *
 * Trọng số gốc của QĐ450 (CC 10, TH 10, mỗi CLO GK 30, mỗi CLO CK 50)
 * được chuẩn hóa ×0,2 để tổng trọng số các đợt = 100% (đúng ràng buộc model mới):
 * CC 2 + TH 2 + KT1 18 + KT2 18 + CK 60 = 100.
 */
export const HUNG_COURSE: Course = {
  id: 'KTLT101',
  maHp: 'KTLT101',
  tenHp: 'Kỹ thuật lập trình',
  soTinChi: 3,
  hinhThucThi: 'Tự luận',
  loaiHp: 'thuong',
  giangVien: 'TS. Trần Thị B',
  namHoc: '2024-2025',
  cloList: HUNG_CLO,
  ploList: [
    { id: 'PLO3', maPlo: 'PLO3', noiDung: 'PLO 3', ploThanhPhanIds: ['PLO3_1'] },
    { id: 'PLO5', maPlo: 'PLO5', noiDung: 'PLO 5', ploThanhPhanIds: ['PLO5_1'] },
    { id: 'PLO6', maPlo: 'PLO6', noiDung: 'PLO 6', ploThanhPhanIds: ['PLO6_1'] },
    { id: 'PLO9', maPlo: 'PLO9', noiDung: 'PLO 9', ploThanhPhanIds: ['PLO9_1'] }
  ],
  ploThanhPhanList: [
    {
      id: 'PLO3_1',
      maPloThanhPhan: 'PLO3.1',
      maPlo: 'PLO3',
      noiDung: 'PLO thành phần 3.1',
      piIds: ['PI3.1', 'PI3.2']
    },
    {
      id: 'PLO5_1',
      maPloThanhPhan: 'PLO5.1',
      maPlo: 'PLO5',
      noiDung: 'PLO thành phần 5.1',
      piIds: ['PI5.1']
    },
    {
      id: 'PLO6_1',
      maPloThanhPhan: 'PLO6.1',
      maPlo: 'PLO6',
      noiDung: 'PLO thành phần 6.1',
      piIds: ['PI6.1']
    },
    {
      id: 'PLO9_1',
      maPloThanhPhan: 'PLO9.1',
      maPlo: 'PLO9',
      noiDung: 'PLO thành phần 9.1',
      piIds: ['PI9.1']
    }
  ],
  piList: [
    {
      id: 'PI3.1',
      maPi: 'PI3.1',
      noiDung: 'PI 3.1',
      ploThanhPhanIds: ['PLO3_1'],
      cloIds: ['CLO1.1', 'CLO1.2']
    },
    {
      id: 'PI3.2',
      maPi: 'PI3.2',
      noiDung: 'PI 3.2',
      ploThanhPhanIds: ['PLO3_1'],
      cloIds: ['CLO1.3', 'CLO1.4']
    },
    {
      id: 'PI5.1',
      maPi: 'PI5.1',
      noiDung: 'PI 5.1',
      ploThanhPhanIds: ['PLO5_1'],
      cloIds: ['CLO2.1']
    },
    {
      id: 'PI6.1',
      maPi: 'PI6.1',
      noiDung: 'PI 6.1',
      ploThanhPhanIds: ['PLO6_1'],
      cloIds: ['CLO2.2']
    },
    {
      id: 'PI9.1',
      maPi: 'PI9.1',
      noiDung: 'PI 9.1',
      ploThanhPhanIds: ['PLO9_1'],
      cloIds: ['CLO3.1']
    }
  ],
  dotDanhGia: [
    {
      id: 'CC',
      tenDotDanhGia: 'Chuyên cần',
      nhom: 'CC',
      cachNhapDiem: 'DIRECT_CLO_SCORE',
      trongSoPhanTram: 2,
      cloList: [{ cloId: 'CLO3.1', tyLePhanBo: 100 }],
      maDeList: []
    },
    {
      id: 'TH',
      tenDotDanhGia: 'Tự học',
      nhom: 'CC',
      cachNhapDiem: 'DIRECT_CLO_SCORE',
      trongSoPhanTram: 2,
      cloList: [{ cloId: 'CLO3.1', tyLePhanBo: 100 }],
      maDeList: []
    },
    KT1_DOT,
    KT2_DOT,
    CK_DOT
  ],
  quyTac: DEFAULT_BUSINESS_RULES
}

/**
 * Hàng điểm thô của SV Nguyễn Văn Hùng
 */
export const HUNG_STUDENT_ROW: RawStudentRow = {
  student: {
    id: 'HUNG01',
    tt: 1,
    maSv: 'HUNG01',
    ho: 'Nguyễn Văn',
    ten: 'Hùng',
    hoTen: 'Nguyễn Văn Hùng',
    ngaySinh: '01/01/2004'
  },
  scores: {
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
}

/** Bản ghi điểm của Hùng theo model nghiệp vụ (dùng trực tiếp cho calculateEvaluation). */
export const HUNG_SCORE_RECORD: StudentCourseScoreRecord = {
  id: 'HUNG01_KTLT101',
  sinhVienId: 'HUNG01',
  hocPhanId: 'KTLT101',
  diemTheoDotDanhGia: [
    {
      cachNhapDiem: 'DIRECT_CLO_SCORE',
      dotDanhGiaId: 'CC',
      diemTheoClo: [{ cloId: 'CLO3.1', diem: 10.0 }]
    },
    {
      cachNhapDiem: 'DIRECT_CLO_SCORE',
      dotDanhGiaId: 'TH',
      diemTheoClo: [{ cloId: 'CLO3.1', diem: 7.5 }]
    },
    {
      cachNhapDiem: 'QUESTION_SCORE',
      dotDanhGiaId: 'KT1',
      deId: 'D1',
      diemTheoCau: [
        { questionId: 'KT1_1.1', diem: 7.5 },
        { questionId: 'KT1_1.2', diem: 6.3 },
        { questionId: 'KT1_1.3', diem: 7.3 }
      ]
    },
    {
      cachNhapDiem: 'QUESTION_SCORE',
      dotDanhGiaId: 'KT2',
      deId: 'D1',
      diemTheoCau: [
        { questionId: 'KT2_1.4', diem: 6.7 },
        { questionId: 'KT2_2.1', diem: 5.0 },
        { questionId: 'KT2_2.2', diem: 7.5 }
      ]
    },
    {
      cachNhapDiem: 'QUESTION_SCORE',
      dotDanhGiaId: 'CK',
      deId: 'D1',
      diemTheoCau: [
        { questionId: 'CK_1.1', diem: 7.1 },
        { questionId: 'CK_1.2', diem: 6.0 },
        { questionId: 'CK_1.3', diem: 7.3 },
        { questionId: 'CK_1.4', diem: 5.0 },
        { questionId: 'CK_2.1', diem: 7.5 },
        { questionId: 'CK_2.2', diem: 2.5 }
      ]
    }
  ]
}
