/**
 * Core Engine: Đo lường & Đánh giá chuẩn đầu ra học phần (CLO/PLO)
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ)
 *
 * Thư mục này chỉ chứa thuần logic TypeScript, 0 phụ thuộc vào Electron/React.
 */

export const CORE_VERSION = '1.0.0'

export * from './types'
export * from './rules'
export * from './utils/numberToWordsVi'
export * from './calculator'
export * from './validator/index'
export * from './io/headerMatcher'
export * from './io/configParser'
export * from './io/rawGradesParser'
export * from './io/templateGenerator'
export * from './exporter/finalGradesReport'
export * from './exporter/examReport'
export * from './exporter/chartRenderer'
