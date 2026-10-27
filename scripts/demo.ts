/**
 * DEMO END-TO-END (offline)
 *
 * Chạy: npm run demo
 *
 * Sinh ra trong thư mục out/demo:
 * - Template_Config.xlsx       : file cấu hình mẫu (7 sheet) của học phần KTLT101
 * - Template_DiemTho.xlsx      : file điểm thô mẫu 10 SV, mỗi SV một ca biên + điểm danh 12 buổi
 * - final_grades_report.xlsx   : báo cáo điểm CLO/PLO + tổng hợp + cảnh báo
 * - exam_analysis_report.xlsx  : phân tích đề thi p, d, Cronbach α
 */

import { mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import {
  applyAttendance,
  calculateAllExamPsychometrics,
  calculateEvaluation,
  parseCourseConfig,
  parseRawGrades,
  validateConfig,
  validateRawGrades,
  writeConfigTemplate,
  writeExamAnalysisReport,
  writeFinalGradesReport,
  writeRawGradesTemplate
} from '@core/index'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from '../tests/fixtures/mockClass'

async function main(): Promise<void> {
  const outDir = resolve(process.cwd(), 'out', 'demo')
  mkdirSync(outDir, { recursive: true })

  const config = buildMockConfig()
  const { students, attendance } = buildMockClass(10)

  const configPath = join(outDir, 'Template_Config.xlsx')
  const rawPath = join(outDir, 'Template_DiemTho.xlsx')

  console.log('1. Sinh file mẫu...')
  await writeConfigTemplate(configPath, config)
  await writeRawGradesTemplate(rawPath, config, {
    students,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })
  console.log('   -', configPath)
  console.log('   -', rawPath)

  console.log('2. Đọc lại file vừa sinh (kiểm tra parser)...')
  const parsedConfig = await parseCourseConfig(configPath)
  let parsedRaw: Awaited<ReturnType<typeof parseRawGrades>>
  try {
    parsedRaw = await parseRawGrades(rawPath, parsedConfig)
  } catch (error) {
    console.error('Lỗi đọc điểm thô:')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
    return
  }

  console.log('3. Kiểm tra hợp lệ...')
  const configIssues = validateConfig(parsedConfig)
  const applied = applyAttendance(parsedRaw, parsedConfig)
  const rawIssues = validateRawGrades(parsedConfig, applied.file)
  const allIssues = [...configIssues, ...rawIssues, ...applied.issues]

  const errors = allIssues.filter((i) => i.level === 'error')
  const warnings = allIssues.filter((i) => i.level === 'warning')
  console.log(`   - Lỗi: ${errors.length}, Cảnh báo: ${warnings.length}`)
  for (const issue of errors.slice(0, 10)) console.log(`     [LỖI] ${issue.message}`)
  for (const issue of warnings.slice(0, 5)) console.log(`     [CẢNH BÁO] ${issue.message}`)

  console.log('4. Tính toán CLO/PLO...')
  const result = calculateEvaluation(parsedConfig, applied.file.students)
  const sample = result.students[0]
  console.log(`   - Số SV: ${result.summary.totalStudents}`)
  console.log(
    `   - SV đầu tiên: ${sample.hoTen} (${sample.maSv}) | CLO: ${JSON.stringify(sample.cloScores)} | TBC CLO: ${sample.tbcClo} | Điểm HP: ${sample.courseScore}`
  )

  console.log('5. Phân tích đề thi...')
  const exams = calculateAllExamPsychometrics(parsedConfig, applied.file.students)
  for (const exam of exams) {
    console.log(
      `   - ${exam.maDauDiem}/${exam.maDe}: N=${exam.soSinhVien}, α=${exam.cronbachAlpha} (${exam.mucDoTinCay})`
    )
  }

  console.log('6. Xuất báo cáo Excel...')
  const finalPath = join(outDir, 'final_grades_report.xlsx')
  const examPath = join(outDir, 'exam_analysis_report.xlsx')
  await writeFinalGradesReport(finalPath, parsedConfig, result, {
    phase: 'both',
    rawFile: applied.file,
    issues: allIssues,
    context: {
      hocKy: applied.file.meta.hocKy ?? 'HK1',
      namHoc: applied.file.meta.namHoc ?? '2026-2027',
      lop: applied.file.meta.lop ?? '1A11_CNTT14',
      giangVien: applied.file.meta.giangVien ?? 'Nguyễn Văn Giảng',
      diaDanh: 'Hải Phòng'
    }
  })
  await writeExamAnalysisReport(examPath, parsedConfig, exams, allIssues)
  console.log('   -', finalPath)
  console.log('   -', examPath)

  console.log('\nHOÀN TẤT. Mở thư mục out/demo để kiểm tra.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
