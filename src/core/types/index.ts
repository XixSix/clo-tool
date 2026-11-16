/**
 * Barrel export cho toàn bộ Data Models & Interfaces của Core Engine
 * Quy chuẩn: Đại học Thành Đông (QĐ 450/QĐ-ĐHTĐ ngày 07/8/2024)
 *
 * Cấu trúc:
 * - course.ts        : Học phần, CLO, kế hoạch đánh giá và mã đề
 * - rule.ts          : Quy tắc nghiệp vụ & điểm danh (BusinessRules, AttendanceRule)
 * - student.ts       : Sinh viên và dữ liệu nhập điểm
 * - gradeSheet.ts    : Dữ liệu bảng điểm nhập vào đọc từ Excel (tách khỏi model nghiệp vụ)
 * - result.ts        : Kết quả tính điểm từng sinh viên/học phần (gồm điểm chuyên cần)
 * - analysis.ts      : Phân tích, thống kê và dữ liệu báo cáo
 * - validation.ts    : Issue/validation
 * - phase.ts         : Giai đoạn nhập điểm (quá trình / cuối kỳ)
 */

export * from './course'
export * from './rule'
export * from './student'
export * from './gradeSheet'
export * from './result'
export * from './analysis'
export * from './validation'
export * from './phase'
