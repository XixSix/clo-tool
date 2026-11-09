/**
 * Fixture ĐA ĐỀ trên CÙNG MỘT đầu điểm — dùng để bẫy bug ô điểm không lọc mã đề.
 *
 * Khác với mock chính (GKT và GTX là 2 đầu điểm khác nhau ở đây mock này dùng
 * ĐÚNG 1 đầu điểm "GK" có 2 đề D1/D2): mỗi SV chỉ làm MỘT trong hai đề;
 * câu của đề kia bị trống trong file điểm thô.
 *
 * Kỳ vọng (Quyết định #9 + semantics maDe):
 * - SV maDe 'D1' chỉ được tính 4 câu của đề D1 (câu đề D2 trống KHÔNG góp tỷ lệ 0)
 * - SV maDe 'D2' chỉ được tính 4 câu của đề D2
 * - SV không khai maDe (~ ALL) làm mọi đề: cả 8 câu đều tính
 *
 * Nếu engine không lọc theo maDe, SV-A sẽ bị kéo điểm ô GK–CLO1 từ 8.0 xuống 4.0
 * vì 2 câu đề D2 trống góp tỷ lệ 0 vào trung bình.
 */

import type {
  AssessmentComponent,
  Course,
  ExamQuestion,
  Student,
  StudentCourseScoreRecord
} from '@core/types'
import { DEFAULT_BUSINESS_RULES } from '@core/rules'

/** Điểm tối đa mỗi câu của đề GK (cùng cấu trúc 2 đề: 2.5 × 4 = 10) */
const GK_MAX = [2.5, 2.5, 2.5, 2.5]

function gkColumn(de: string, c: number): string {
  return `GK_${de}_C${c}`
}

function gkVariant(de: string) {
  const cauHoi: ExamQuestion[] = GK_MAX.map((max, i) => ({
    id: gkColumn(de, i + 1),
    cau: `Câu ${i + 1}`,
    // Câu 1+2 → CLO1, câu 3+4 → CLO2 (giống nhau giữa 2 đề)
    cloId: i < 2 ? 'CLO1' : 'CLO2',
    diemToiDa: max,
    loai: 'TL'
  }))
  return { id: `GK_${de}`, maDe: de, cauHoi }
}

export function buildMockMultiDeCourse(): Course {
  // Cột chuyên cần thang 10 nhập trực tiếp cho CLO1
  const ccDot: AssessmentComponent = {
    id: 'CC',
    tenDotDanhGia: 'Điểm danh chuyên cần',
    nhom: 'CC',
    cachNhapDiem: 'DIRECT_CLO_SCORE',
    trongSoPhanTram: 20,
    cloList: [{ cloId: 'CLO1', tyLePhanBo: 100 }],
    maDeList: []
  }

  // 2 đề của CÙNG đầu điểm GK — mỗi CLO chiếm 50% trọng số đợt (40% toàn khóa)
  const gkDot: AssessmentComponent = {
    id: 'GK',
    tenDotDanhGia: 'Kiểm tra giữa kỳ – 2 đề cùng đầu điểm',
    nhom: 'GK',
    cachNhapDiem: 'QUESTION_SCORE',
    trongSoPhanTram: 80,
    cloList: [
      { cloId: 'CLO1', tyLePhanBo: 50 },
      { cloId: 'CLO2', tyLePhanBo: 50 }
    ],
    maDeList: [gkVariant('D1'), gkVariant('D2')]
  }

  return {
    id: 'KTLT999',
    maHp: 'KTLT999',
    tenHp: 'Học phần thử đa đề',
    soTinChi: 2,
    hinhThucThi: 'Tự luận',
    loaiHp: 'thuong',
    giangVien: 'TS. Lê Văn C',
    namHoc: '2025-2026',
    cloList: [
      { id: 'CLO1', maClo: 'CLO1', noiDung: 'CLO thử 1', bacNangLuc: '3/6', trongSoClo: 1 },
      { id: 'CLO2', maClo: 'CLO2', noiDung: 'CLO thử 2', bacNangLuc: '3/6', trongSoClo: 1 }
    ],
    ploList: [
      { id: 'PLO1', maPlo: 'PLO1', noiDung: 'PLO thử 1', ploThanhPhanIds: ['PLO1_1'] },
      { id: 'PLO2', maPlo: 'PLO2', noiDung: 'PLO thử 2', ploThanhPhanIds: ['PLO2_1'] }
    ],
    ploThanhPhanList: [
      {
        id: 'PLO1_1',
        maPloThanhPhan: 'PLO1.1',
        maPlo: 'PLO1',
        noiDung: 'PLO 1.1',
        piIds: ['PI1.1']
      },
      {
        id: 'PLO2_1',
        maPloThanhPhan: 'PLO2.1',
        maPlo: 'PLO2',
        noiDung: 'PLO 2.1',
        piIds: ['PI2.1']
      }
    ],
    piList: [
      {
        id: 'PI1.1',
        maPi: 'PI1.1',
        noiDung: 'Chỉ số 1.1',
        ploThanhPhanIds: ['PLO1_1'],
        cloIds: ['CLO1']
      },
      {
        id: 'PI2.1',
        maPi: 'PI2.1',
        noiDung: 'Chỉ số 2.1',
        ploThanhPhanIds: ['PLO2_1'],
        cloIds: ['CLO2']
      }
    ],
    dotDanhGia: [ccDot, gkDot],
    quyTac: { ...DEFAULT_BUSINESS_RULES }
  }
}

/**
 * 3 sinh viên ca biên:
 * - SV-A làm đề D1 (câu D2 để trống)
 * - SV-B làm đề D2 (câu D1 để trống)
 * - SV-C không khai maDe (~ ALL), làm cả 2 đề
 */
export interface MockMultiDeData {
  students: Student[]
  records: StudentCourseScoreRecord[]
}

export function buildMockMultiDeData(): MockMultiDeData {
  const students: Student[] = [
    {
      id: 'SV001A',
      tt: 1,
      maSv: 'SV001A',
      ho: 'Sinh Viên',
      ten: 'A',
      hoTen: 'Sinh Viên A (làm đề D1)'
    },
    {
      id: 'SV002B',
      tt: 2,
      maSv: 'SV002B',
      ho: 'Sinh Viên',
      ten: 'B',
      hoTen: 'Sinh Viên B (làm đề D2)'
    },
    {
      id: 'SV003C',
      tt: 3,
      maSv: 'SV003C',
      ho: 'Sinh Viên',
      ten: 'C',
      hoTen: 'Sinh Viên C (làm mọi đề)'
    }
  ]

  const records: StudentCourseScoreRecord[] = [
    {
      id: 'SV001A_KTLT999',
      sinhVienId: 'SV001A',
      hocPhanId: 'KTLT999',
      diemTheoDotDanhGia: [
        {
          cachNhapDiem: 'DIRECT_CLO_SCORE',
          dotDanhGiaId: 'CC',
          diemTheoClo: [{ cloId: 'CLO1', diem: 8 }]
        },
        {
          cachNhapDiem: 'QUESTION_SCORE',
          dotDanhGiaId: 'GK',
          deId: 'D1',
          diemTheoCau: [
            { questionId: 'GK_D1_C1', diem: 2 },
            { questionId: 'GK_D1_C2', diem: 2 },
            { questionId: 'GK_D1_C3', diem: 1 },
            { questionId: 'GK_D1_C4', diem: 2 }
          ]
        }
      ]
    },
    {
      id: 'SV002B_KTLT999',
      sinhVienId: 'SV002B',
      hocPhanId: 'KTLT999',
      diemTheoDotDanhGia: [
        {
          cachNhapDiem: 'DIRECT_CLO_SCORE',
          dotDanhGiaId: 'CC',
          diemTheoClo: [{ cloId: 'CLO1', diem: 6 }]
        },
        {
          cachNhapDiem: 'QUESTION_SCORE',
          dotDanhGiaId: 'GK',
          deId: 'D2',
          diemTheoCau: [
            { questionId: 'GK_D2_C1', diem: 2 },
            { questionId: 'GK_D2_C2', diem: 1 },
            { questionId: 'GK_D2_C3', diem: 2.5 },
            { questionId: 'GK_D2_C4', diem: 2 }
          ]
        }
      ]
    },
    {
      id: 'SV003C_KTLT999',
      sinhVienId: 'SV003C',
      hocPhanId: 'KTLT999',
      diemTheoDotDanhGia: [
        {
          cachNhapDiem: 'DIRECT_CLO_SCORE',
          dotDanhGiaId: 'CC',
          diemTheoClo: [{ cloId: 'CLO1', diem: 5 }]
        },
        {
          cachNhapDiem: 'QUESTION_SCORE',
          dotDanhGiaId: 'GK',
          deId: 'ALL',
          diemTheoCau: [
            { questionId: 'GK_D1_C1', diem: 2 },
            { questionId: 'GK_D1_C2', diem: 2 },
            { questionId: 'GK_D1_C3', diem: 2 },
            { questionId: 'GK_D1_C4', diem: 2 },
            { questionId: 'GK_D2_C1', diem: 2.5 },
            { questionId: 'GK_D2_C2', diem: 2.5 },
            { questionId: 'GK_D2_C3', diem: 2.5 },
            { questionId: 'GK_D2_C4', diem: 2.5 }
          ]
        }
      ]
    }
  ]

  return { students, records }
}
