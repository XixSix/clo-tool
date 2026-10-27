/** API tương thích cho các generator template Excel. */

import type { CourseConfig } from '../types'
import { writeWorkbook } from '../utils/excel'
import { buildConfigWorkbook } from './configTemplateGenerator'
import { buildRawGradesWorkbook, type RawTemplateOptions } from './rawGradesTemplateGenerator'

export { buildConfigWorkbook } from './configTemplateGenerator'
export { buildRawGradesWorkbook } from './rawGradesTemplateGenerator'
export type { RawTemplateOptions } from './rawGradesTemplateGenerator'

export async function writeConfigTemplate(filePath: string, config: CourseConfig): Promise<void> {
  await writeWorkbook(buildConfigWorkbook(config), filePath)
}

export async function writeRawGradesTemplate(
  filePath: string,
  config: CourseConfig,
  options: RawTemplateOptions = {}
): Promise<void> {
  await writeWorkbook(buildRawGradesWorkbook(config, options), filePath)
}
