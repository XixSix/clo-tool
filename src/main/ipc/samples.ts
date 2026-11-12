import { ipcMain } from 'electron'
import { access, copyFile, mkdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import type { SampleResultDto } from '../../shared/ipc'
import { errorMessage } from './common'

export function registerSampleHandlers(): void {
  ipcMain.handle('samples:create', async (_event, outputDir: string): Promise<SampleResultDto> => {
    try {
      const templateDir = join(__dirname, '..', '..', 'resources', 'templates')
      const configSource = join(templateDir, 'Template_Config.xlsx')
      const rawSource = join(templateDir, 'Template_DiemTho.xlsx')
      const processSource = join(templateDir, 'Template_DiemTho_QuaTrinh.xlsx')
      const finalSource = join(templateDir, 'Template_DiemTho_CuoiKy.xlsx')
      await access(configSource, constants.R_OK)
      await access(rawSource, constants.R_OK)
      await access(processSource, constants.R_OK)
      await access(finalSource, constants.R_OK)
      await mkdir(outputDir, { recursive: true })
      const configPath = join(outputDir, 'Template_Config.xlsx')
      const rawPath = join(outputDir, 'Template_DiemTho.xlsx')
      const processRawPath = join(outputDir, 'Template_DiemTho_QuaTrinh.xlsx')
      const finalRawPath = join(outputDir, 'Template_DiemTho_CuoiKy.xlsx')
      await copyFile(configSource, configPath)
      await copyFile(rawSource, rawPath)
      await copyFile(processSource, processRawPath)
      await copyFile(finalSource, finalRawPath)
      return { ok: true, dir: outputDir, configPath, rawPath, processRawPath, finalRawPath }
    } catch (error) {
      return {
        ok: false,
        dir: outputDir,
        error: 'Không tìm thấy file mẫu trong resources/templates. ' + errorMessage(error, '')
      }
    }
  })
}
