/**
 * Test ánh xạ lỗi core → vị trí UI trong editor cấu hình môn.
 *
 * Dùng chính dữ liệu mẫu (buildMockCourse) đi qua vòng adapter → validate để
 * bảo đảm không có false positive và mỗi issue rơi đúng bucket.
 */

import { describe, expect, it } from 'vitest'
import { validateCourse } from '@core/validator/course'
import type { CourseConfig, EditorConfig } from '../src/renderer/src/components/screens/courses/course-editor-types'
import {
  courseToEditor,
  editorConfigToCourse,
  normalizeEditorWeights
} from '../src/renderer/src/components/screens/courses/course-adapter'
import {
  collectEditorIssues,
  dedupeIssues,
  locateIssues
} from '../src/renderer/src/lib/course-issue-locator'
import { buildMockCourse } from './fixtures/mockClass'

let counter = 0
function nextId(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}`
}

function toEditor(config: CourseConfig): EditorConfig {
  return {
    ...config,
    cloList: config.cloList.map((clo) => ({ ...clo, _id: nextId('clo') })),
    keHoachDanhGia: config.keHoachDanhGia.map((row) => ({ ...row, _id: nextId('plan') })),
    cauHoi: config.cauHoi.map((row) => ({ ...row, _id: nextId('question') })),
    maTranPlo: config.maTranPlo.map((row) => ({ ...row, _id: nextId('plo') }))
  }
}

function loadMockEditor(): EditorConfig {
  return toEditor(courseToEditor(buildMockCourse()))
}

describe('locateIssues — dữ liệu mẫu vòng tròn', () => {
  it('không có lỗi sau khi nạp và chuẩn hoá trọng số', () => {
    const editor = normalizeEditorWeights(loadMockEditor())
    const issues = dedupeIssues([
      ...validateCourse(editorConfigToCourse(editor)),
      ...collectEditorIssues(editor)
    ])
    expect(issues.filter((issue) => issue.level === 'error')).toEqual([])
  })

  it('mọi issue đều có tab và tabStats đếm đủ', () => {
    const editor = normalizeEditorWeights(loadMockEditor())
    const issues = dedupeIssues([
      ...validateCourse(editorConfigToCourse(editor)),
      ...collectEditorIssues(editor)
    ])
    const located = locateIssues(issues, editor)
    expect(located.tabOfIssue.size).toBe(issues.length)
    const total =
      located.tabStats['info-clo'].errors +
      located.tabStats['info-clo'].warnings +
      located.tabStats['plan-exam'].errors +
      located.tabStats['plan-exam'].warnings +
      located.tabStats.plo.errors +
      located.tabStats.plo.warnings
    expect(total).toBe(issues.length)
  })
})

describe('locateIssues — lỗi trọng số', () => {
  it('trọng số lẻ rơi vào bucket đợt đánh giá', () => {
    const editor = loadMockEditor()
    const row = editor.keHoachDanhGia.find((r) => r.maDauDiem === 'GKT')
    expect(row).toBeDefined()
    row!.trongSoPhanTram = 5.5

    const issues = dedupeIssues([
      ...validateCourse(editorConfigToCourse(editor)),
      ...collectEditorIssues(editor)
    ])
    expect(issues.some((i) => i.level === 'error' && i.targetId === 'GKT')).toBe(true)

    const located = locateIssues(issues, editor)
    expect((located.dot.GKT ?? []).length).toBeGreaterThan(0)
  })
})

describe('collectEditorIssues', () => {
  it('CLO có nội dung nhưng trống mã → bucket clo.__empty__', () => {
    const editor = loadMockEditor()
    editor.cloList[0] = { ...editor.cloList[0], maClo: '' }

    const issues = collectEditorIssues(editor)
    const located = locateIssues(issues, editor)
    expect((located.clo.__empty__ ?? []).length).toBeGreaterThan(0)
  })

  it('dòng kế hoạch chưa chọn CLO bị bắt', () => {
    const editor = loadMockEditor()
    const row = editor.keHoachDanhGia[0]
    row.clo = ''
    const issues = collectEditorIssues(editor)
    expect(
      issues.some((i) => i.scope === 'assessment' && i.targetId === row.maDauDiem)
    ).toBe(true)
  })

  it('dòng ma trận thiếu PLO hoặc PI bị cảnh báo', () => {
    const editor = loadMockEditor()
    editor.maTranPlo.push({ _id: nextId('plo'), plo: 'PLO9', pi: '', clo: 'CLO1' })
    const issues = collectEditorIssues(editor)
    expect(issues.some((i) => i.scope === 'plo' && i.level === 'warning')).toBe(true)
  })
})
