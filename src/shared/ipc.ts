/**
 * Kiểu dữ liệu dùng chung giữa Main process, Preload và Renderer.
 * Chỉ chứa type/DTO, không import Node/Electron để renderer dùng được.
 */

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
  finalReportPath?: string
  examReportPath?: string
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
  error?: string
}

export interface FilePickKind {
  kind: 'config' | 'raw'
}

/** API mà preload expose ra window.api */
export interface CloApi {
  pickFile: (kind: FilePickKind['kind']) => Promise<string | null>
  pickDirectory: () => Promise<string | null>
  parseConfig: (configPath: string) => Promise<ConfigSummaryDto>
  parseRawGrades: (configPath: string, rawPath: string) => Promise<RawSummaryDto>
  runPipeline: (configPath: string, rawPath: string, outputDir: string) => Promise<RunResultDto>
  createSamples: (outputDir: string) => Promise<SampleResultDto>
  openPath: (path: string) => Promise<void>
}
