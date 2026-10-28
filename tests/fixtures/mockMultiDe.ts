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

import type { CourseConfig, QuestionColumn } from '@core/types'
import { DEFAULT_BUSINESS_RULES } from '@core/rules'

/** Điểm tối đa mỗi câu của đề GK (cùng cấu trúc 2 đề: 2.5 × 4 = 10) */
const GK_MAX = [2.5, 2.5, 2.5, 2.5]

function gkColumn(de: string, c: number): string {
  return `GK_${de}_C${c}`
}

export function buildMockMultiDeConfig(): CourseConfig {
  const cauHoi: QuestionColumn[] = []

  // Cột chuyên cần thang 10 khai như 1 câu hỏi của ô (CC, CLO1)
  cauHoi.push({
    maCotDiem: 'CC',
    maDauDiem: 'CC',
    cau: 'Câu 1',
    clo: 'CLO1',
    diemToiDa: 10,
    maDe: 'ALL'
  })

  // 2 đề của CÙNG đầu điểm GK, cùng khối câu theo CLO
  for (const de of ['D1', 'D2']) {
    GK_MAX.forEach((max, i) => {
      cauHoi.push({
        maCotDiem: gkColumn(de, i + 1),
        maDauDiem: 'GK',
        cau: `Câu ${i + 1}`,
        // Câu 1+2 → CLO1, câu 3+4 → CLO2 (giống nhau giữa 2 đề)
        clo: i < 2 ? 'CLO1' : 'CLO2',
        diemToiDa: max,
        maDe: de,
        loai: 'TL'
      })
    })
  }

  return {
    courseInfo: {
      maHp: 'KTLT999',
      tenHp: 'Học phần thử đa đề',
      soTinChi: 2,
      hinhThucThi: 'Tự luận',
      loaiHp: 'thuong'
    },
    cloList: [
      { maClo: 'CLO1', noiDung: 'CLO thử 1', bacNangLuc: '3/6', trongSoClo: 1 },
      { maClo: 'CLO2', noiDung: 'CLO thử 2', bacNangLuc: '3/6', trongSoClo: 1 }
    ],
    keHoachDanhGia: [
      {
        nhom: 'CC',
        thanhPhan: 'Điểm danh chuyên cần',
        maDauDiem: 'CC',
        clo: 'CLO1',
        trongSoPhanTram: 20,
        hinhThuc: 'Điểm danh'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra giữa kỳ – 2 đề cùng đầu điểm',
        maDauDiem: 'GK',
        clo: 'CLO1',
        trongSoPhanTram: 40,
        hinhThuc: 'Tự luận (câu 1+2)'
      },
      {
        nhom: 'GK',
        thanhPhan: 'Kiểm tra giữa kỳ – 2 đề cùng đầu điểm',
        maDauDiem: 'GK',
        clo: 'CLO2',
        trongSoPhanTram: 40,
        hinhThuc: 'Tự luận (câu 3+4)'
      }
    ],
    cauHoi,
    maTranPlo: [
      { plo: 'PLO1', pi: 'PI1.1', clo: 'CLO1' },
      { plo: 'PLO2', pi: 'PI2.1', clo: 'CLO2' }
    ],
    quyTac: { ...DEFAULT_BUSINESS_RULES }
  }
}

/**
 * 3 sinh viên ca biên:
 * - SV-A làm đề D1 (câu D2 để trống)
 * - SV-B làm đề D2 (câu D1 để trống)
 * - SV-C không khai maDe (~ ALL), làm cả 2 đề
 */
export function buildMockMultiDeStudents() {
  return [
    {
      student: {
        tt: 1,
        maSv: 'SV001A',
        ho: 'Sinh Viên',
        ten: 'A',
        hoTen: 'Sinh Viên A (làm đề D1)'
      },
      scores: {
        maDe: 'D1',
        diemCacCot: {
          CC: 8,
          GK_D1_C1: 2,
          GK_D1_C2: 2,
          GK_D1_C3: 1,
          GK_D1_C4: 2
          // Câu đề D2 trống -> phải không được tính vào SV này
        } as Record<string, number | 'VT' | null>
      }
    },
    {
      student: {
        tt: 2,
        maSv: 'SV002B',
        ho: 'Sinh Viên',
        ten: 'B',
        hoTen: 'Sinh Viên B (làm đề D2)'
      },
      scores: {
        maDe: 'D2',
        diemCacCot: {
          CC: 6,
          GK_D2_C1: 2,
          GK_D2_C2: 1,
          GK_D2_C3: 2.5,
          GK_D2_C4: 2
        } as Record<string, number | 'VT' | null>
      }
    },
    {
      student: {
        tt: 3,
        maSv: 'SV003C',
        ho: 'Sinh Viên',
        ten: 'C',
        hoTen: 'Sinh Viên C (làm mọi đề)'
      },
      scores: {
        //Không khai maDe => coi như ALL
        diemCacCot: {
          CC: 5,
          GK_D1_C1: 2,
          GK_D1_C2: 2,
          GK_D1_C3: 2,
          GK_D1_C4: 2,
          GK_D2_C1: 2.5,
          GK_D2_C2: 2.5,
          GK_D2_C3: 2.5,
          GK_D2_C4: 2.5
        } as Record<string, number | 'VT' | null>
      }
    }
  ]
}
