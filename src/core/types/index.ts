/**
 * Barrel export cho toàn bộ Data Models & Interfaces của Core Engine
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Cấu trúc:
 * - course.ts        : Học phần, CLO, kế hoạch đánh giá và mã đề
 * - rule.ts          : Quy tắc nghiệp vụ & điểm danh (BusinessRules, AttendanceRule)
 * - student.ts       : Sinh viên và dữ liệu nhập điểm
 * - rawGrades.ts     : Dữ liệu điểm thô đọc từ Excel (tách khỏi model nghiệp vụ)
 * - result.ts        : Kết quả tính điểm từng sinh viên/học phần
 * - analysis.ts      : Phân tích, thống kê và dữ liệu báo cáo
 * - psychometrics.ts : Kết quả kiểm định đề thi (p, d, Cronbach's alpha)
 */

export * from './course'
export * from './rule'
export * from './student'
export * from './rawGrades'
export * from './result'
export * from './analysis'
export * from './psychometrics'
export * from './validation'
