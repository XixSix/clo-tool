/** API tương thích cho generator template điểm thô. */

import type { Course } from '../types'
import { writeWorkbook } from '../utils/excel'
import { buildGradeSheetWorkbook, type GradeSheetTemplateOptions } from './gradeSheetTemplateGenerator'

export { buildGradeSheetWorkbook } from './gradeSheetTemplateGenerator'
export type { GradeSheetTemplateOptions } from './gradeSheetTemplateGenerator'

export async function writeGradeSheetTemplate(
  filePath: string,
  course: Course,
  options: GradeSheetTemplateOptions = {}
): Promise<void> {
  await writeWorkbook(buildGradeSheetWorkbook(course, options), filePath)
}
