/**
 * Kiểu dữ liệu dùng chung giữa Main process, Preload và Renderer.
 * Chỉ chứa type/DTO, không import Node/Electron để renderer dùng được.
 */

import type {
  ClassEvaluationSummary,
  CourseConfig,
  ExamPsychometrics,
  GradePhase,
  ProcessedStudentResult,
  RawGrades
} from '../core/types'

export type IssueLevelDto = 'error' | 'warning'

export interface IssueDto {
  level: IssueLevelDto
  sheet?: string
  row?: number
  column?: string
  message: string
  suggestion?: string
}

export interface CloInfoDto {
  code: string
  content: string
  weight: number
}

export interface ConfigSummaryDto {
  ok: boolean
  filePath: string
  courseName?: string
  maHp?: string
  soTinChi?: number
  hinhThucThi?: string
  lop?: string
  giangVien?: string
  hocKy?: string
  namHoc?: string
  cloList: CloInfoDto[]
  planCount: number
  totalWeight: number
  ploCount: number
  rules?: {
    nguongDatClo: number
    nguongDatPlo: number
    nguongDatHp: number
    hpMethod: string
  }
  issues: IssueDto[]
  hasErrors: boolean
  error?: string
}

export interface RawSummaryDto {
  ok: boolean
  filePath: string
  phase?: GradePhase
  studentCount: number
  sessionCount: number
  missingDataCount: number
  absentFinalCount: number
  issues: IssueDto[]
  hasErrors: boolean
  error?: string
}

export interface ExamSummaryDto {
  maDauDiem: string
  maDe: string
  n: number
  alpha: number
  mucDo: string
  warning?: string
}

export interface CloStatDto {
  code: string
  passedPercent: number
  mean: number
  isBelowThreshold: boolean
}

export interface RunResultDto {
  ok: boolean
  outputDir: string
  /** Giai đoạn vừa chạy; bỏ trống với luồng một file cũ */
  phase?: GradePhase
  /** Mã lần chạy đã lưu snapshot (chỉ có khi lưu thành công) */
  runId?: string
  finalReportPath?: string
  examReportPath?: string
  /** Báo cáo giai đoạn quá trình (chỉ có khi chạy `runProcess`) */
  processReportPath?: string
  studentCount: number
  passedCount: number
  passedPercent: number
  meanCourseScore: number
  absentFinalCount: number
  missingDataCount: number
  cloStats: CloStatDto[]
  exams: ExamSummaryDto[]
  issues: IssueDto[]
  error?: string
}

export interface SampleResultDto {
  ok: boolean
  dir: string
  configPath?: string
  rawPath?: string
  /** File điểm thô giai đoạn quá trình (CC/GK) */
  processRawPath?: string
  /** File điểm thô giai đoạn cuối kỳ (CK + Mã đề) */
  finalRawPath?: string
  error?: string
}

/** Kết quả xuất PDF báo cáo */
export interface ExportPdfResultDto {
  ok: boolean
  /** Người dùng bấm huỷ hộp thoại lưu file */
  canceled?: boolean
  path?: string
  error?: string
}

/* ============================================================
   Workspace: lưu danh sách môn học + lịch sử chạy của từng môn
   ============================================================ */

/** Một lần chạy pipeline đã lưu cho môn học */
export interface RunHistoryEntryDto {
  /** Mã lần chạy — dùng để mở snapshot chi tiết (rỗng với dữ liệu cũ) */
  runId?: string
  /** Ghi chú người dùng cho lần chạy */
  label?: string
  /** Mốc epoch (ms) lúc chạy xong */
  ts: number
  configPath: string
  rawPath: string
  outputDir: string
  finalReportPath?: string
  examReportPath?: string
  studentCount: number
  passedPercent: number
  meanCourseScore: number
}

/**
 * Snapshot đầy đủ của một lần chạy — lưu ở main process dưới dạng JSON,
 * renderer tải theo nhu cầu để hiển thị màn Sinh viên / Báo cáo.
 */
export interface RunSnapshotDto {
  runId: string
  sessionId: string
  ts: number
  label?: string
  /** Giai đoạn của snapshot; dữ liệu cũ không có trường này */
  phase?: GradePhase
  config: CourseConfig
  students: ProcessedStudentResult[]
  summary: ClassEvaluationSummary
  exams: ExamPsychometrics[]
  /** Điểm thô đã áp điểm danh — chỉ snapshot quá trình lưu để ghép ở giai đoạn cuối */
  rawGrades?: RawGrades
  /** Dấu vân tay Config lúc chạy quá trình, dùng phát hiện Config bị đổi */
  configSignature?: string
}

/** Một môn học đang quản lý trong app */
export interface SessionDto {
  id: string
  maHp: string
  courseName: string
  soTinChi: number
  lop?: string
  hocKy?: string
  namHoc?: string
  giangVien?: string
  cloCount?: number
  configPath?: string
  rawPath?: string
  outDir?: string
  /** Mã snapshot kết quả giai đoạn quá trình (để chạy tiếp giai đoạn cuối kỳ) */
  processRunId?: string
  /** Báo cáo Excel giai đoạn quá trình đã xuất */
  processReportPath?: string
  addedAt: number
  /** Mở lần gần nhất — để xếp "Môn học hiện tại" */
  lastOpenedAt: number
  history: RunHistoryEntryDto[]
}

/** Toàn bộ workspace: môn active + danh sách môn */
export interface WorkspaceDto {
  activeId: string | null
  sessions: SessionDto[]
}

export interface FilePickKind {
  kind: 'config' | 'raw'
}

/** Trạng thái tự cập nhật do main process đẩy xuống renderer */
export interface UpdateStatusDto {
  state: 'checking' | 'available' | 'downloading' | 'downloaded' | 'latest' | 'error'
  /** Phiên bản tìm thấy (khi có bản mới hoặc đã tải xong) */
  version?: string
  /** Phần trăm đã tải (0–100) */
  percent?: number
  message?: string
}

/** API mà preload expose ra window.api */
export interface CloApi {
  pickFile: (kind: FilePickKind['kind']) => Promise<string | null>
  pickDirectory: () => Promise<string | null>
  parseConfig: (configPath: string) => Promise<ConfigSummaryDto>
  parseRawGrades: (
    configPath: string,
    rawPath: string,
    phase?: GradePhase
  ) => Promise<RawSummaryDto>
  runPipeline: (
    configPath: string,
    rawPath: string,
    outputDir: string,
    sessionId?: string
  ) => Promise<RunResultDto>
  /** Giai đoạn quá trình: tính CLO từ CC/GK, xuất báo cáo và lưu snapshot */
  runProcess: (
    configPath: string,
    rawPath: string,
    outputDir: string,
    sessionId?: string
  ) => Promise<RunResultDto>
  /** Giai đoạn cuối kỳ: ghép điểm CK vào snapshot quá trình rồi tính lại toàn bộ */
  runFinal: (
    configPath: string,
    finalRawPath: string,
    outputDir: string,
    processRunId: string,
    sessionId?: string
  ) => Promise<RunResultDto>
  /** Tải snapshot chi tiết của 1 lần chạy (null nếu chưa có / dữ liệu cũ) */
  getRunSnapshot: (runId: string) => Promise<RunSnapshotDto | null>
  /** Xoá snapshot của 1 lần chạy */
  deleteRunSnapshot: (runId: string) => Promise<void>
  /** In báo cáo hiện tại ra PDF (hộp thoại lưu file do main process mở) */
  exportPdf: (defaultName?: string) => Promise<ExportPdfResultDto>
  createSamples: (outputDir: string) => Promise<SampleResultDto>
  openPath: (path: string) => Promise<void>
  loadWorkspace: () => Promise<WorkspaceDto>
  saveWorkspace: (ws: WorkspaceDto) => Promise<void>
  /** Phiên bản app đang chạy (đọc từ package.json) */
  getAppVersion: () => Promise<string>
  /** Kích hoạt kiểm tra bản cập nhật */
  checkForUpdates: () => Promise<void>
  /** Khởi động lại và cài bản đã tải xong */
  installUpdate: () => Promise<void>
  /** Đăng ký nhận trạng thái cập nhật; trả về hàm huỷ đăng ký */
  onUpdateStatus: (listener: (status: UpdateStatusDto) => void) => () => void
}
