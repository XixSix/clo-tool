/**
 * Barrel export cho toàn bộ Data Models & Interfaces của Core Engine
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Cấu trúc:
 * - course.ts        : Cấu hình học phần (CourseConfig, CLO, kế hoạch đánh giá)
 * - rule.ts          : Quy tắc nghiệp vụ & điểm danh (BusinessRules, AttendanceRule)
 * - student.ts       : Dữ liệu điểm thô sinh viên (RawStudentRow)
 * - result.ts        : Kết quả tính điểm & thống kê toàn lớp (traceability)
 * - psychometrics.ts : Kết quả kiểm định đề thi (p, d, Cronbach's alpha)
 */

export * from './course'
export * from './rule'
export * from './student'
export * from './result'
export * from './psychometrics'
export * from './validation'
