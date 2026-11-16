/**
 * Module tính điểm và thống kê Chuẩn đầu ra chương trình đào tạo (PLO)
 * Quy chuẩn: QĐ 450/QĐ-ĐHTĐ
 *
 * Cây điểm: PLO → PLO thành phần → PI → CLO.
 * Điểm mỗi cấp là trung bình cộng các nút con có điểm.
 */

import Decimal from 'decimal.js'
import { roundHalfUp, roundStep } from '../../rules'
import type {
  CLOResult,
  PIResult,
  PartialPLOResult,
  PLOStatistics,
  PLOResult,
  Course,
  StudentCourseResult
} from '../../types'

/** Điểm từng PI từ điểm CLO. */
export function calculatePiResults(
  course: Course,
  cloResults: CLOResult[]
): Record<string, PIResult> {
  const cloScoreById = new Map(cloResults.map((c) => [c.cloId, c.diem]))
  const mode = course.quyTac.cheDoLamTron ?? 'chain'
  const result: Record<string, PIResult> = {}

  for (const pi of course.piList) {
    let sum = new Decimal(0)
    let count = 0
    for (const cloId of pi.cloIds) {
      const score = cloScoreById.get(cloId)
      if (score === undefined) continue
      sum = sum.add(score)
      count++
    }
    result[pi.id] = {
      piId: pi.id,
      diem: count > 0 ? roundStep(sum.div(count).toNumber(), mode, 1) : 0
    }
  }

  return result
}

/** Điểm PLO thành phần từ điểm các PI. */
export function calculatePartialPloResults(
  course: Course,
  piResults: Record<string, PIResult>
): Record<string, PartialPLOResult> {
  const mode = course.quyTac.cheDoLamTron ?? 'chain'
  const result: Record<string, PartialPLOResult> = {}

  for (const partial of course.ploThanhPhanList) {
    const pi: PIResult[] = []
    let sum = new Decimal(0)
    let count = 0

    for (const piId of partial.piIds) {
      const piResult = piResults[piId]
      if (!piResult) continue
      pi.push(piResult)
      sum = sum.add(piResult.diem)
      count++
    }

    result[partial.id] = {
      ploThanhPhanId: partial.id,
      diem: count > 0 ? roundStep(sum.div(count).toNumber(), mode, 1) : 0,
      pi
    }
  }

  return result
}

/** Toàn bộ cây điểm PLO của một sinh viên. */
export function calculatePloResults(course: Course, cloResults: CLOResult[]): PLOResult[] {
  const mode = course.quyTac.cheDoLamTron ?? 'chain'
  const piResults = calculatePiResults(course, cloResults)
  const partialResults = calculatePartialPloResults(course, piResults)

  return course.ploList.map((plo) => {
    const ploThanhPhan: PartialPLOResult[] = []
    let sum = new Decimal(0)
    let count = 0

    for (const partialId of plo.ploThanhPhanIds) {
      const partial = partialResults[partialId]
      if (!partial) continue
      ploThanhPhan.push(partial)
      sum = sum.add(partial.diem)
      count++
    }

    return {
      ploId: plo.id,
      diem: count > 0 ? roundStep(sum.div(count).toNumber(), mode, 1) : 0,
      ploThanhPhan
    }
  })
}

/** Thống kê tỷ lệ Đạt/Không đạt + TB cho từng PLO toàn lớp. */
export function calculatePloStatistics(
  course: Course,
  students: StudentCourseResult[],
  nguongDatPlo = 4.0
): PLOStatistics[] {
  const total = students.length
  const mode = course.quyTac.cheDoLamTron ?? 'chain'

  return course.ploList.map((plo) => {
    const scores = students.map((student) => student.plo.find((p) => p.ploId === plo.id)?.diem ?? 0)
    const passed = scores.filter((s) => s >= nguongDatPlo).length
    const failed = total - passed
    const tyLeDat = total > 0 ? roundHalfUp((passed / total) * 100, 1) : 0
    const tyLeKhongDat = total > 0 ? roundHalfUp(100 - tyLeDat, 1) : 0
    const sum = scores.reduce((acc, s) => acc.add(s), new Decimal(0))
    const trungBinh = total > 0 ? roundStep(sum.div(total).toNumber(), mode, 1) : 0

    return {
      ploId: plo.id,
      soSinhVienDat: passed,
      tyLeDat,
      soSinhVienKhongDat: failed,
      tyLeKhongDat,
      trungBinh
    }
  })
}
