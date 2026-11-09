/**
 * Dữ liệu MOCK cho một lớp học phần thực tế (dùng để test end-to-end, chạy demo và sinh template).
 *
 * Học phần KTLT101 – 5 CLO (CLO1–CLO5), trọng số nhóm CC/GK/CK = 20/30/50, điểm danh 12 buổi.
 *
 * Cấu trúc "đề thi thật" để dằn vặt core engine:
 * - CC (20%): chỉ đo CLO1 → kích hoạt cảnh báo "CLO chỉ được đo bằng chuyên cần" (#7)
 * - GK gồm 2 đề:
 *   + GKT (trắc nghiệm maDe D1): 40 câu × 0,25 điểm (tổng 10), đo CLO2 (câu 1–12),
 *     CLO3 (câu 13–28), CLO4 (câu 29–40) → trọng số 6%/5%/4%;
 *     điểm mỗi câu binary 0/0,25 như chấm máy trắc nghiệm
 *   + GTX (tự luận maDe D2): 4 câu, điểm tối đa 3/2,5/2/2,5 (tổng 10),
 *     đo CLO2 (câu 1), CLO3 (câu 2), CLO4 (câu 3+4 — 2 câu cùng 1 CLO) → 4%/5%/6%
 * - CK (tự luận maDe D3): 5 câu, điểm tối đa 2,5/2/2/1,75/1,75 (tổng 10),
 *   đo CLO2 (câu 1), CLO3 (câu 2+3 — 2 câu cùng 1 CLO), CLO4 (câu 4), CLO5 (câu 5)
 *   → 10%/10%/20%/10%; chung 1 CLO có trọng số KHÔNG đều nhau giữa các lần đo
 * - Tổng trọng số KẾ HOẠCH = 100%
 *
 * Quyết định #9: câu/cột điểm trống = 0 (câu trống trong đề nhiều câu = 0 điểm câu,
 * vẫn góp tỷ lệ 0 vào trung bình của ô; cột trống thang 10 = 0 cả ô).
 *
 * 10 sinh viên ĐẦU TIÊN là dữ liệu CỐ ĐỊNH, mỗi SV đại diện một ca biên:
 * - SV0: mã bắt đầu bằng số 0 (phải giữ nguyên dạng văn bản), dữ liệu đầy đủ (baseline)
 * - SV1: đầy đủ, điểm lẻ .25/.75 để kiểm làm tròn
 * - SV2: đạt điểm tối đa mọi câu (TN đúng 40/40, TL trọn điểm)
 * - SV3: điểm yếu (nhiều CLO dưới ngưỡng 4.0)
 * - SV4: vắng thi cuối kỳ (VT toàn bộ cột CK)
 * - SV5: chuyên cần kém (nhiều buổi V/M/V-CP)
 * - SV6: thiếu dữ liệu dạng câu: 1 câu TN (GKT_C07) + 1 câu TL (GTX_C4) trống
 * - SV7: chưa nhập điểm nào (kể cả Ngày sinh), chưa có kết quả đánh giá
 * - SV8: có ghi chú "Sinh viên học lại"
 * - SV9: thi đủ nhưng 1 câu CK = 0 điểm (câu 3), có 1 buổi vắng có phép
 *
 * Sinh viên vượt quá 10 được sinh giả ngẫu nhiên có seed (không mang ca biên).
 * Template phát hành chỉ dùng đúng 10 SV này (xem scripts/gen-templates.ts).
 */

import type {
  AssessmentComponent,
  Course,
  ExamQuestion,
  ExamVariant,
  RawStudentRow
} from '@core/types'
import { DEFAULT_BUSINESS_RULES } from '@core/rules'

export const MOCK_SESSION_LABELS = Array.from({ length: 12 }, (_, i) => `Buổi ${i + 1}`)

/** Đề GKT (trắc nghiệm 40 câu): khối câu theo từng CLO */
const GKT_BLOCKS: Array<{ clo: string; from: number; to: number }> = [
  { clo: 'CLO2', from: 1, to: 12 },
  { clo: 'CLO3', from: 13, to: 28 },
  { clo: 'CLO4', from: 29, to: 40 }
]
/** Điểm tối đa từng câu của đề GTX (CLO2/CLO3/CLO4/CLO4) */
const GTX_MAX = [3, 2.5, 2, 2.5]
/** Điểm tối đa từng câu của đề CK (CLO2/CLO3/CLO3/CLO4/CLO5) */
const CK_MAX = [2.5, 2, 2, 1.75, 1.75]

function gktColumn(c: number): string {
  return `GKT_C${String(c).padStart(2, '0')}`
}

export function buildMockCourse(): Course {
  // 40 câu trắc nghiệm của đề GKT, sinh theo khối CLO
  const gktCauHoi: ExamQuestion[] = []
  for (const block of GKT_BLOCKS) {
    for (let c = block.from; c <= block.to; c++) {
      gktCauHoi.push({
        id: gktColumn(c),
        cau: `Câu ${c}`,
        cloId: block.clo,
        diemToiDa: 0.25,
        loai: 'TN'
      })
    }
  }

  const gtxCauHoi: ExamQuestion[] = GTX_MAX.map((max, i) => ({
    id: `GTX_C${i + 1}`,
    cau: `Câu ${i + 1}`,
    // GTX: câu 1 → CLO2, câu 2 → CLO3, câu 3+4 → CLO4 (2 câu cùng 1 CLO)
    cloId: i === 0 ? 'CLO2' : i === 1 ? 'CLO3' : 'CLO4',
    diemToiDa: max,
    loai: 'TL'
  }))

  const ckCauHoi: ExamQuestion[] = CK_MAX.map((max, i) => ({
    id: `CK_C${i + 1}`,
    cau: `Câu ${i + 1}`,
    // CK: câu 1 → CLO2, câu 2+3 → CLO3 (2 câu cùng 1 CLO), câu 4 → CLO4, câu 5 → CLO5
    cloId: i === 0 ? 'CLO2' : i === 1 || i === 2 ? 'CLO3' : i === 3 ? 'CLO4' : 'CLO5',
    diemToiDa: max,
    loai: 'TL'
  }))

  const gktVariant: ExamVariant = { id: 'GKT_D1', maDe: 'D1', cauHoi: gktCauHoi }
  const gtxVariant: ExamVariant = { id: 'GTX_D2', maDe: 'D2', cauHoi: gtxCauHoi }
  const ckVariant: ExamVariant = { id: 'CK_D3', maDe: 'D3', cauHoi: ckCauHoi }

  const attendanceDot: AssessmentComponent = {
    id: 'CC',
    tenDotDanhGia: 'Điểm danh chuyên cần',
    nhom: 'CC',
    cachNhapDiem: 'ATTENDANCE',
    trongSoPhanTram: 20,
    cloList: [{ cloId: 'CLO1', tyLePhanBo: 100 }],
    maDeList: [],
    buoiDiemDanh: MOCK_SESSION_LABELS.map((label) => ({ id: label, tenBuoi: label }))
  }

  const gktDot: AssessmentComponent = {
    id: 'GKT',
    tenDotDanhGia: 'Kiểm tra giữa kỳ – đề trắc nghiệm',
    nhom: 'GK',
    cachNhapDiem: 'QUESTION_SCORE',
    trongSoPhanTram: 15,
    // Trọng số cũ theo từng CLO là 6% / 5% / 4% trên tổng 15%
    cloList: [
      { cloId: 'CLO2', tyLePhanBo: (6 / 15) * 100 },
      { cloId: 'CLO3', tyLePhanBo: (5 / 15) * 100 },
      { cloId: 'CLO4', tyLePhanBo: (4 / 15) * 100 }
    ],
    maDeList: [gktVariant]
  }

  const gtxDot: AssessmentComponent = {
    id: 'GTX',
    tenDotDanhGia: 'Kiểm tra giữa kỳ – đề tự luận',
    nhom: 'GK',
    cachNhapDiem: 'QUESTION_SCORE',
    trongSoPhanTram: 15,
    // Trọng số cũ theo từng CLO là 4% / 5% / 6% trên tổng 15%
    cloList: [
      { cloId: 'CLO2', tyLePhanBo: (4 / 15) * 100 },
      { cloId: 'CLO3', tyLePhanBo: (5 / 15) * 100 },
      { cloId: 'CLO4', tyLePhanBo: (6 / 15) * 100 }
    ],
    maDeList: [gtxVariant]
  }

  const ckDot: AssessmentComponent = {
    id: 'CK',
    tenDotDanhGia: 'Thi kết thúc học phần',
    nhom: 'CK',
    cachNhapDiem: 'QUESTION_SCORE',
    trongSoPhanTram: 50,
    // Trọng số cũ theo từng CLO là 10% / 10% / 20% / 10%
    cloList: [
      { cloId: 'CLO2', tyLePhanBo: 20 },
      { cloId: 'CLO3', tyLePhanBo: 20 },
      { cloId: 'CLO4', tyLePhanBo: 40 },
      { cloId: 'CLO5', tyLePhanBo: 20 }
    ],
    maDeList: [ckVariant]
  }

  const ploRows: Array<{ plo: string; pIs: string[]; clos: string[] }> = [
    { plo: 'PLO2', pIs: ['PI2.1', 'PI2.2'], clos: ['CLO1', 'CLO2'] },
    { plo: 'PLO3', pIs: ['PI3.1', 'PI3.2'], clos: ['CLO3', 'CLO4'] },
    { plo: 'PLO4', pIs: ['PI4.1'], clos: ['CLO5'] }
  ]

  return {
    id: 'KTLT101',
    maHp: 'KTLT101',
    tenHp: 'Kỹ thuật lập trình',
    soTinChi: 3,
    hinhThucThi: 'Tự luận',
    loaiHp: 'thuong',
    giangVien: 'TS. Nguyễn Văn A',
    namHoc: '2024-2025',
    cloList: [
      {
        id: 'CLO1',
        maClo: 'CLO1',
        noiDung: 'Nhận thức được vai trò của chuyên cần, ý thức và trách nhiệm trong học tập',
        bacNangLuc: '2/6',
        trongSoClo: 1
      },
      {
        id: 'CLO2',
        maClo: 'CLO2',
        noiDung: 'Giải thích các khái niệm lập trình và áp dụng cú pháp ngôn ngữ C',
        bacNangLuc: '3/6',
        trongSoClo: 1
      },
      {
        id: 'CLO3',
        maClo: 'CLO3',
        noiDung: 'Vận dụng cấu trúc dữ liệu và giải thuật để giải quyết bài toán',
        bacNangLuc: '3/6',
        trongSoClo: 1
      },
      {
        id: 'CLO4',
        maClo: 'CLO4',
        noiDung: 'Thiết kế, cài đặt và kiểm thử chương trình',
        bacNangLuc: '3/5',
        trongSoClo: 1
      },
      {
        id: 'CLO5',
        maClo: 'CLO5',
        noiDung: 'Làm việc nhóm, thuyết trình và ý thức trách nhiệm nghề nghiệp',
        bacNangLuc: '4/6',
        trongSoClo: 1
      }
    ],
    ploList: ploRows.map(({ plo }) => ({
      id: plo,
      maPlo: plo,
      noiDung: `Chuẩn đầu ra chương trình ${plo}`,
      ploThanhPhanIds: [`${plo}_1`]
    })),
    ploThanhPhanList: ploRows.map(({ plo, pIs }) => ({
      id: `${plo}_1`,
      maPloThanhPhan: `${plo}.1`,
      maPlo: plo,
      noiDung: `PLO thành phần ${plo}.1`,
      piIds: pIs
    })),
    piList: ploRows.flatMap(({ plo, pIs, clos }) =>
      pIs.map((pi, idx) => ({
        id: pi,
        maPi: pi,
        noiDung: `Chỉ số ${pi}`,
        ploThanhPhanIds: [`${plo}_1`],
        cloIds: [clos[idx]]
      }))
    ),
    dotDanhGia: [attendanceDot, gktDot, gtxDot, ckDot],
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

/**
 * Chọn vị trí câu SAI trong khối câu trắc nghiệm một cách deterministic:
 * các câu sai trải đều với bước s = floor(kích thước khối / số câu sai),
 * dịch đi `offset` (theo mã SV) để mỗi SV sai ở bộ câu khác nhau.
 */
function mkWrongPos(size: number, wrong: number, offset: number): Set<number> {
  const positions = new Set<number>()
  if (wrong <= 0) return positions
  const step = Math.max(1, Math.floor(size / wrong))
  for (let m = 0; m < wrong; m++) {
    positions.add((m * step + offset) % size)
  }
  return positions
}

const HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô']
const TEN = ['Anh', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hùng', 'Lan']
const TEN_DEM = ['Văn', 'Thị', 'Minh', 'Quang', 'Thu', 'Đức', 'Ngọc', 'Hữu']

export interface MockClassData {
  students: RawStudentRow[]
  attendance: Record<string, Record<string, string>>
}

/** Số câu ĐÚNG của 1 SV trong đề GKT theo từng CLO (khối 12 / 16 / 12 câu) */
interface TnDungCounts {
  CLO2: number
  CLO3: number
  CLO4: number
}

/** Đặc tả 1 sinh viên mẫu cố định */
interface CuratedStudentSpec {
  maSv: string
  hoTen: string
  ngaySinh?: string
  ghiChu?: string
  /** 12 ký hiệu điểm danh, theo thứ tự MOCK_SESSION_LABELS (Buổi 1 → Buổi 12) */
  diemDanh: string[]
  /** Số câu đúng đề GKT theo từng CLO (mỗi câu 0,25 điểm, đúng/sai binary) */
  tnDung?: TnDungCounts
  /** Toàn bộ 40 câu TN trống (SV7 — chưa nhập điểm nào) */
  tnTrong?: boolean
  /** Mã cột TN bị bỏ trống (thiếu dữ liệu — Quyết định #9 cấp câu) */
  nullCau?: string[]
  /** Điểm GTX_C1..C4 (max 3 / 2,5 / 2 / 2,5); null = trống */
  gtx: Array<number | null>
  /** Điểm CK_C1..C5 (max 2,5 / 2 / 2 / 1,75 / 1,75); 'VT' = vắng thi, null = trống */
  ck: Array<number | 'VT' | null>
}

/** Sinh cột điểm đầy đủ của 1 SV mẫu từ đặc tả (CC tự tính từ điểm danh) */
function buildCuratedColumns(spec: CuratedStudentSpec): RawStudentRow['scores']['diemCacCot'] {
  const cols: RawStudentRow['scores']['diemCacCot'] = {}

  if (spec.tnTrong) {
    for (let c = 1; c <= 40; c++) cols[gktColumn(c)] = null
  } else if (spec.tnDung) {
    const offset = Number(spec.maSv.slice(-2))
    for (const block of GKT_BLOCKS) {
      const size = block.to - block.from + 1
      const wrong = size - spec.tnDung[block.clo as keyof TnDungCounts]
      const wrongPos = mkWrongPos(size, wrong, offset)
      for (let c = block.from; c <= block.to; c++) {
        const col = gktColumn(c)
        if (spec.nullCau?.includes(col)) {
          cols[col] = null
          continue
        }
        cols[col] = wrongPos.has(c - block.from) ? 0 : 0.25
      }
    }
  }

  GTX_MAX.forEach((_, i) => {
    cols[`GTX_C${i + 1}`] = spec.gtx[i] ?? null
  })
  CK_MAX.forEach((_, i) => {
    cols[`CK_C${i + 1}`] = spec.ck[i] ?? null
  })

  return cols
}

/**
 * 10 sinh viên mẫu cố định, mỗi SV một ca biên (xem header file).
 * Điểm chọn sẵn bậc 0,25, giá trị cố định để kết quả tính được đối chiếu dễ dàng.
 */
const CURATED_STUDENTS: CuratedStudentSpec[] = [
  {
    // SV0 – baseline: đầy đủ thông tin, mã SV có số 0 ở đầu
    maSv: '0123456789',
    hoTen: 'Nguyễn Văn Đạt',
    ngaySinh: '01/01/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'OL', 'M'],
    tnDung: { CLO2: 9, CLO3: 12, CLO4: 9 },
    gtx: [2.25, 2, 1.5, 2],
    ck: [1.75, 1.5, 1.5, 1.25, 1.25]
  },
  {
    // SV1 – đầy đủ, điểm lẻ .25/.75 để kiểm làm tròn
    maSv: '2311100011',
    hoTen: 'Trần Thị Hạnh',
    ngaySinh: '05/03/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'M'],
    tnDung: { CLO2: 10, CLO3: 11, CLO4: 9 },
    gtx: [2.5, 2, 1.5, 2],
    ck: [2, 1.5, 1.25, 1.25, 1.25]
  },
  {
    // SV2 – đạt điểm tối đa mọi câu (TN 40/40, TL trọn điểm)
    maSv: '2311100012',
    hoTen: 'Lê Minh Hải',
    ngaySinh: '12/07/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'],
    tnDung: { CLO2: 12, CLO3: 16, CLO4: 12 },
    gtx: [3, 2.5, 2, 2.5],
    ck: [2.5, 2, 2, 1.75, 1.75]
  },
  {
    // SV3 – điểm yếu, nhiều CLO dưới ngưỡng Đạt 4.0
    maSv: '2311100013',
    hoTen: 'Phạm Thu Chi',
    ngaySinh: '21/09/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'V-CP', 'V', 'M'],
    tnDung: { CLO2: 3, CLO3: 4, CLO4: 3 },
    gtx: [0.75, 0.5, 0.5, 0.5],
    ck: [0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    // SV4 – vắng thi cuối kỳ: toàn bộ cột CK = VT
    maSv: '2311100014',
    hoTen: 'Hoàng Văn Dũng',
    ngaySinh: '08/11/2004',
    ghiChu: 'Vắng thi cuối kỳ',
    diemDanh: ['X', 'X', 'X', 'V', 'X', 'V-CP', 'X', 'V', 'X', 'X', 'X', 'X'],
    tnDung: { CLO2: 8, CLO3: 11, CLO4: 8 },
    gtx: [2, 1.75, 1.25, 1.75],
    ck: ['VT', 'VT', 'VT', 'VT', 'VT']
  },
  {
    // SV5 – chuyên cần kém: nhiều buổi V / M / V-CP
    maSv: '2311100015',
    hoTen: 'Vũ Ngọc Hà',
    ngaySinh: '17/02/2005',
    diemDanh: ['M', 'V', 'X', 'V', 'M', 'V-CP', 'M', 'V', 'X', 'OL', 'V', 'M'],
    tnDung: { CLO2: 6, CLO3: 8, CLO4: 6 },
    gtx: [1.5, 1.25, 1, 1.25],
    ck: [1, 1, 1, 0.75, 0.75]
  },
  {
    // SV6 – thiếu dữ liệu dạng câu: 1 câu TN + 1 câu TL trống (QĐ #9 cấp câu)
    maSv: '2311100016',
    hoTen: 'Bùi Minh Đức',
    ngaySinh: '03/04/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'OL'],
    tnDung: { CLO2: 11, CLO3: 14, CLO4: 11 },
    nullCau: ['GKT_C07'],
    gtx: [2.25, 2, 1.5, null],
    ck: [1.75, 1.75, 1.5, 1, 1.25]
  },
  {
    // SV7 – chưa nhập điểm nào (kể cả Ngày sinh): thiếu dữ liệu hàng loạt
    maSv: '2311100017',
    hoTen: 'Đỗ Hữu Giang',
    ngaySinh: undefined,
    diemDanh: ['OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL', 'OL'],
    tnTrong: true,
    gtx: [null, null, null, null],
    ck: [null, null, null, null, null]
  },
  {
    // SV8 – có ghi chú "Sinh viên học lại", điểm trung bình khá
    maSv: '2311100018',
    hoTen: 'Đặng Ngọc Hùng',
    ngaySinh: '30/10/2004',
    ghiChu: 'Sinh viên học lại',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'M', 'X', 'M'],
    tnDung: { CLO2: 7, CLO3: 10, CLO4: 8 },
    gtx: [1.5, 1.25, 1, 1.25],
    ck: [1, 1, 1.25, 1, 1.25]
  },
  {
    // SV9 – thi đủ cột nhưng 1 câu CK = 0 điểm (câu 3); có 1 buổi vắng có phép
    maSv: '2311100019',
    hoTen: 'Bùi Quang Tuấn',
    ngaySinh: '14/08/2005',
    diemDanh: ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'V-CP'],
    tnDung: { CLO2: 11, CLO3: 15, CLO4: 11 },
    gtx: [2.5, 2.25, 1.75, 2.25],
    ck: [2, 1.75, 0, 1.25, 1.25]
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
      const nameParts = spec.hoTen.trim().split(/\s+/)
      const ten = nameParts.pop() ?? ''
      const ho = nameParts.join(' ')
      students.push({
        student: {
          id: spec.maSv,
          tt: i + 1,
          maSv: spec.maSv,
          ho,
          ten,
          hoTen: spec.hoTen,
          ngaySinh: spec.ngaySinh
        },
        scores: {
          maDe: 'ALL',
          diemCacCot: buildCuratedColumns(spec),
          ghiChu: spec.ghiChu
        }
      })
      attendance[maSv] = Object.fromEntries(
        MOCK_SESSION_LABELS.map((label, idx) => [label, spec.diemDanh[idx]])
      )
      continue
    }

    // Các SV còn lại: sinh giả ngẫu nhiên, dữ liệu luôn đầy đủ
    const ho = HO[i % HO.length]
    const tenDem = TEN_DEM[i % TEN_DEM.length]
    const ten = TEN[i % TEN.length]
    const hoTen = `${ho} ${tenDem} ${ten}`
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

    // Trắc nghiệm: mỗi câu binary 0/0,25 như chấm máy
    const diemCacCot: RawStudentRow['scores']['diemCacCot'] = {}
    const prob = ability / 10
    for (let c = 1; c <= 40; c++) {
      diemCacCot[gktColumn(c)] = random() < prob ? 0.25 : 0
    }
    GTX_MAX.forEach((max, k) => {
      diemCacCot[`GTX_C${k + 1}`] = quarter(clamp(prob * max + (random() - 0.5) * 1.2, 0, max))
    })
    CK_MAX.forEach((max, k) => {
      diemCacCot[`CK_C${k + 1}`] = quarter(clamp(prob * max + (random() - 0.5) * 1, 0, max))
    })

    students.push({
      student: {
        id: maSv,
        tt: i + 1,
        maSv,
        ho: `${ho} ${tenDem}`,
        ten,
        hoTen,
        ngaySinh: `${String((i % 28) + 1).padStart(2, '0')}/${String((i % 12) + 1).padStart(2, '0')}/2005`
      },
      scores: {
        maDe: 'ALL',
        diemCacCot,
        ghiChu: undefined
      }
    })
  }

  return { students, attendance }
}
