/**
 * Module thống kê tổng hợp kết quả học tập toàn lớp (CLO, PLO, Điểm HP).
 */

import Decimal from 'decimal.js'
import { roundHalfUp } from '../../rules'
import { calculatePloStatistics } from '../plo'
import type {
  CLOStatistics,
  ClassEvaluationSummary,
  Course,
  CourseStatistics,
  StudentCourseResult
} from '../../types'

/**
 * Thống kê tỷ lệ Đạt/Không đạt, Min, Max, TB cho từng CLO, PLO và điểm HP toàn lớp.
 */
export function calculateClassSummary(
  course: Course,
  students: StudentCourseResult[]
): ClassEvaluationSummary {
  const rules = course.quyTac
  const tongSinhVien = students.length
  const soSinhVienVangThi = students.filter((s) => s.vangThiCuoiKy).length
  const soSinhVienDuocTinh = students.filter((s) => !s.vangThiCuoiKy).length
  const soSinhVienThieuDuLieu = students.filter((s) => s.thieuDuLieu).length

  const clo: CLOStatistics[] = course.cloList.map((cloDef) => {
    const scores = students.map((s) => s.clo.find((c) => c.cloId === cloDef.id)?.diem ?? 0)
    const soSinhVienDat = scores.filter((s) => s >= rules.nguongDatClo).length
    const soSinhVienKhongDat = tongSinhVien - soSinhVienDat
    const tyLeDat = tongSinhVien > 0 ? roundHalfUp((soSinhVienDat / tongSinhVien) * 100, 1) : 0
    const tyLeKhongDat = tongSinhVien > 0 ? roundHalfUp(100 - tyLeDat, 1) : 0
    const sumScore = scores.reduce((acc, s) => acc.add(s), new Decimal(0))
    const trungBinh = tongSinhVien > 0 ? roundHalfUp(sumScore.div(tongSinhVien).toNumber(), 1) : 0

    return {
      cloId: cloDef.id,
      soSinhVienDat,
      tyLeDat,
      soSinhVienKhongDat,
      tyLeKhongDat,
      trungBinh,
      thapNhat: scores.length > 0 ? Math.min(...scores) : 0,
      caoNhat: scores.length > 0 ? Math.max(...scores) : 0,
      duoiNguongCanhBao: tyLeDat < rules.tyLeDatCloCanhBao
    }
  })

  const plo = calculatePloStatistics(course, students, rules.nguongDatPlo)

  const courseScores = students.map((s) => s.diemHocPhan)
  const passed = courseScores.filter((s) => s >= rules.nguongDatHp).length
  const failed = tongSinhVien - passed
  const tyLeDat = tongSinhVien > 0 ? roundHalfUp((passed / tongSinhVien) * 100, 1) : 0
  const tyLeKhongDat = tongSinhVien > 0 ? roundHalfUp(100 - tyLeDat, 1) : 0
  const sumHp = courseScores.reduce((acc, s) => acc.add(s), new Decimal(0))
  const trungBinh = tongSinhVien > 0 ? roundHalfUp(sumHp.div(tongSinhVien).toNumber(), 1) : 0

  const hocPhan: CourseStatistics = {
    soSinhVienDat: passed,
    tyLeDat,
    soSinhVienKhongDat: failed,
    tyLeKhongDat,
    trungBinh,
    thapNhat: courseScores.length > 0 ? Math.min(...courseScores) : 0,
    caoNhat: courseScores.length > 0 ? Math.max(...courseScores) : 0
  }

  const canhBao: string[] = []
  if (tongSinhVien < rules.nguongCoMauN) {
    canhBao.push(`Quy mô lớp N = ${tongSinhVien} < ${rules.nguongCoMauN} sinh viên.`)
  }
  if (soSinhVienThieuDuLieu > 0) {
    canhBao.push(`Có ${soSinhVienThieuDuLieu} sinh viên chưa nhập đủ điểm.`)
  }
  if (soSinhVienVangThi > 0) {
    canhBao.push(
      `Có ${soSinhVienVangThi} sinh viên vắng thi cuối kỳ (đã tính vào mẫu số tỷ lệ đạt với điểm 0).`
    )
  }

  return {
    tongSinhVien,
    soSinhVienDuocTinh,
    soSinhVienVangThi,
    soSinhVienThieuDuLieu,
    clo,
    plo,
    hocPhan,
    canhBao
  }
}
