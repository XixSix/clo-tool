/**
 * Sinh lại file mẫu đi kèm app (chạy khi thay đổi cấu trúc template):
 *
 *   npm run gen:templates
 *
 * Kết quả:
 * - resources/templates/Template_Config.xlsx  : Config mẫu đầy đủ 7 sheet + hướng dẫn
 * - resources/templates/Template_DiemTho.xlsx : Điểm thô mẫu 32 SV + điểm danh 12 buổi
 */

import { resolve, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { writeConfigTemplate, writeRawGradesTemplate } from '@core/index'
import { buildMockClass, buildMockConfig, MOCK_SESSION_LABELS } from '../tests/fixtures/mockClass'

async function main(): Promise<void> {
  const outDir = resolve(process.cwd(), 'resources', 'templates')
  mkdirSync(outDir, { recursive: true })

  const config = buildMockConfig()
  const { students, attendance } = buildMockClass(32)

  await writeConfigTemplate(join(outDir, 'Template_Config.xlsx'), config)
  await writeRawGradesTemplate(join(outDir, 'Template_DiemTho.xlsx'), config, {
    students,
    attendance,
    lop: '1A11_CNTT14',
    giangVien: 'Nguyễn Văn Giảng',
    hocKy: 'HK1',
    namHoc: '2026-2027',
    sessions: MOCK_SESSION_LABELS.map((label) => ({ label }))
  })

  console.log('Đã sinh:')
  console.log(' -', join(outDir, 'Template_Config.xlsx'))
  console.log(' -', join(outDir, 'Template_DiemTho.xlsx'))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
