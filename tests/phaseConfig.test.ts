import { describe, expect, it } from 'vitest'
import { buildMockConfig } from './fixtures/mockClass'
import {
  configSignature,
  finalConfig,
  finalExamVariants,
  hasMultipleFinalExamVariants,
  phaseConfig,
  processConfig
} from '@core/index'
import { scoreColumnsFromConfig } from '@core/utils/scoreColumns'

describe('phaseConfig', () => {
  it('lọc đúng kế hoạch và câu hỏi của giai đoạn quá trình', () => {
    const config = buildMockConfig()
    const process = processConfig(config)

    expect(process.keHoachDanhGia.every((item) => item.nhom !== 'CK')).toBe(true)
    expect(process.keHoachDanhGia).toHaveLength(
      config.keHoachDanhGia.filter((item) => item.nhom !== 'CK').length
    )
    expect(process.cauHoi.every((q) => q.maDauDiem !== 'CK')).toBe(true)

    const columns = scoreColumnsFromConfig(process)
    expect(columns).toContain('CC')
    expect(columns).toContain('GKT_C01')
    expect(columns).toContain('GTX_C1')
    expect(columns.some((column) => column.startsWith('CK_'))).toBe(false)
  })

  it('lọc đúng kế hoạch và câu hỏi của giai đoạn cuối kỳ', () => {
    const config = buildMockConfig()
    const final = finalConfig(config)

    expect(final.keHoachDanhGia.every((item) => item.nhom === 'CK')).toBe(true)
    expect(final.cauHoi.every((q) => q.maDauDiem === 'CK')).toBe(true)

    const columns = scoreColumnsFromConfig(final)
    expect(columns).toEqual(['CK_C1', 'CK_C2', 'CK_C3', 'CK_C4', 'CK_C5'])
  })

  it('không mutate Config gốc', () => {
    const config = buildMockConfig()
    const planCount = config.keHoachDanhGia.length
    const questionCount = config.cauHoi.length

    phaseConfig(config, 'process')
    phaseConfig(config, 'final')

    expect(config.keHoachDanhGia).toHaveLength(planCount)
    expect(config.cauHoi).toHaveLength(questionCount)
  })

  it('nhận diện học phần nhiều đề CK và bỏ qua mã ALL', () => {
    const config = buildMockConfig()
    expect(hasMultipleFinalExamVariants(config)).toBe(false)
    expect(finalExamVariants(config)).toEqual(['D3'])

    const twoVariants = {
      ...config,
      cauHoi: config.cauHoi.map((q) =>
        q.maDauDiem === 'CK' && q.maCotDiem === 'CK_C1' ? { ...q, maDe: 'D4' } : q
      )
    }
    expect(hasMultipleFinalExamVariants(twoVariants)).toBe(true)
    expect(finalExamVariants(twoVariants).sort()).toEqual(['D3', 'D4'])
  })

  it('configSignature ổn định và đổi khi Config đổi', () => {
    const config = buildMockConfig()
    const same = buildMockConfig()
    const changed = {
      ...config,
      quyTac: { ...config.quyTac, nguong_dat_clo: 5 }
    }

    expect(configSignature(config)).toBe(configSignature(same))
    expect(configSignature(changed)).not.toBe(configSignature(config))
  })
})
