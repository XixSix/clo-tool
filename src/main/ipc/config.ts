import { ipcMain } from 'electron'
import type { ConfigSummaryDto } from '../../shared/ipc'
import { hasErrors, toIssueDto } from './common'
import { loadConfig } from './loaders'

export function registerConfigHandlers(): void {
  ipcMain.handle('config:parse', async (_event, configPath: string): Promise<ConfigSummaryDto> => {
    const loaded = await loadConfig(configPath)
    if (!loaded.config) {
      return {
        ok: false,
        filePath: configPath,
        cloList: [],
        planCount: 0,
        totalWeight: 0,
        ploCount: 0,
        issues: loaded.issues.map(toIssueDto),
        hasErrors: true,
        error: loaded.error
      }
    }

    const config = loaded.config
    return {
      ok: true,
      filePath: configPath,
      courseName: config.courseInfo.tenHp,
      maHp: config.courseInfo.maHp,
      soTinChi: config.courseInfo.soTinChi,
      hinhThucThi: config.courseInfo.hinhThucThi,
      cloList: config.cloList.map((clo) => ({
        code: clo.maClo,
        content: clo.noiDung,
        weight: clo.trongSoClo ?? 1
      })),
      planCount: config.keHoachDanhGia.length,
      totalWeight: config.keHoachDanhGia.reduce((sum, plan) => sum + plan.trongSoPhanTram, 0),
      ploCount: new Set(config.maTranPlo.map((matrix) => matrix.plo)).size,
      rules: {
        nguongDatClo: config.quyTac.nguong_dat_clo,
        nguongDatPlo: config.quyTac.nguong_dat_plo,
        nguongDatHp: config.quyTac.nguong_dat_hp,
        hpMethod: config.quyTac.hp_method
      },
      issues: loaded.issues.map(toIssueDto),
      hasErrors: hasErrors(loaded.issues)
    }
  })
}
