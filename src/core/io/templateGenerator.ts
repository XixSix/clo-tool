/** API tương thích cho generator template điểm thô. */

import type { Course } from '../types'
import { writeWorkbook } from '../utils/excel'
import { buildRawGradesWorkbook, type RawTemplateOptions } from './rawGradesTemplateGenerator'

export { buildRawGradesWorkbook } from './rawGradesTemplateGenerator'
export type { RawTemplateOptions } from './rawGradesTemplateGenerator'

export async function writeRawGradesTemplate(
  filePath: string,
  course: Course,
  options: RawTemplateOptions = {}
): Promise<void> {
  await writeWorkbook(buildRawGradesWorkbook(course, options), filePath)
}
