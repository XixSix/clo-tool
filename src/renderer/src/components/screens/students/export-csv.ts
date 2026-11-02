import { formatScore } from '@renderer/lib/format'
import type { StudentRow } from '@renderer/hooks/use-student-filters'
import type { SessionDto } from '../../../../../shared/ipc'

/** Dựng nội dung CSV danh sách sinh viên (đã áp bộ lọc hiện tại). */
export function buildStudentCsvRows(rows: StudentRow[]): (string | number)[][] {
  const header = [
    'TT',
    'Mã SV',
    'Họ tên',
    'Ngày sinh',
    'Mã đề',
    'CC',
    'GK',
    'CK',
    'TBC CLO',
    'Điểm học phần',
    'Kết quả',
    'CLO đạt',
    'Cảnh báo'
  ]
  const body = rows.map(({ student, passedClos, totalClos }) => [
    student.tt,
    student.maSv,
    student.hoTen,
    student.ngaySinh ?? '',
    student.maDe ?? '',
    formatScore(student.groupScores.CC?.score),
    formatScore(student.groupScores.GK?.score),
    formatScore(student.groupScores.CK?.score),
    formatScore(student.tbcClo),
    formatScore(student.courseScore),
    student.isPassedHp ? 'Đạt' : 'Không đạt',
    `${passedClos}/${totalClos}`,
    student.issues.map((i) => i.message).join(' | ')
  ])
  return [header, ...body]
}

/** Tên file CSV chuẩn hoá theo mã học phần + lớp. */
export function studentCsvFileName(session: SessionDto): string {
  return `sinh-vien_${session.maHp}${session.lop ? `_${session.lop}` : ''}.csv`
}
