/**
 * Sinh lại file mẫu đi kèm app (chạy khi thay đổi cấu trúc template):
 *
 *   npm run gen:templates
 *
 * Kết quả:
 * - resources/templates/Template_DiemTho.xlsx : Điểm thô mẫu 10 SV, mỗi SV một ca biên
 */

import { resolve, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { writeRawGradesTemplate } from '@core/index'
import { buildMockClass, buildMockCourse, MOCK_SESSION_LABELS } from '../tests/fixtures/mockClass'

async function main(): Promise<void> {
  const outDir = resolve(process.cwd(), 'resources', 'templates')
  mkdirSync(outDir, { recursive: true })

  const course = buildMockCourse()
  const { students, attendance } = buildMockClass(10)

  await writeRawGradesTemplate(join(outDir, 'Template_DiemTho.xlsx'), course, {
    students,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })

  console.log('Đã sinh:')
  console.log(' -', join(outDir, 'Template_DiemTho.xlsx'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
