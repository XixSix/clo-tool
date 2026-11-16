import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_RULES } from '@core/rules'
import type { EditorConfig } from '../src/renderer/src/components/screens/courses/course-editor-types'
import {
  clearCourseDraft,
  draftKey,
  parseCourseDraft,
  readCourseDraft,
  writeCourseDraft
} from '../src/renderer/src/lib/course-draft'

class MemoryStore {
  private data = new Map<string, string>()
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
  removeItem(key: string): void {
    this.data.delete(key)
  }
}

function editorFixture(): EditorConfig {
  return {
    courseInfo: {
      maHp: 'KTLT101',
      tenHp: 'Kỹ thuật lập trình',
      soTinChi: 3,
      hinhThucThi: 'Tự luận',
      loaiHp: 'thuong'
    },
    // Dòng dở dang: chưa có mã CLO — adapter sẽ bỏ, nhưng nháp phải giữ để không mất việc.
    cloList: [{ _id: 'clo-1', maClo: '', noiDung: 'đang viết dở', bacNangLuc: '2/6' }],
    keHoachDanhGia: [
      {
        _id: 'plan-1',
        nhom: 'CK',
        thanhPhan: 'Thi cuối kỳ',
        maDauDiem: 'CK',
        clo: 'CLO1',
        trongSoPhanTram: 33.5
      }
    ],
    cauHoi: [],
    maTranPlo: [],
    quyTac: DEFAULT_BUSINESS_RULES
  }
}

describe('parseCourseDraft', () => {
  it('trả null cho dữ liệu rỗng/hỏng', () => {
    expect(parseCourseDraft(null)).toBeNull()
    expect(parseCourseDraft('')).toBeNull()
    expect(parseCourseDraft('{')).toBeNull()
    expect(parseCourseDraft('{"editor":{}}')).toBeNull()
    expect(
      parseCourseDraft('{"editor":{"courseInfo":{}},"meta":{}}')
    ).toBeNull()
  })

  it('thiếu savedAt thì dùng mốc epoch', () => {
    const draft = parseCourseDraft(
      JSON.stringify({ editor: editorFixture(), meta: {} })
    )
    expect(draft).not.toBeNull()
    expect(draft!.savedAt).toBe(new Date(0).toISOString())
  })

  it('thiếu meta thì coi là rỗng', () => {
    const draft = parseCourseDraft(JSON.stringify({ editor: editorFixture() }))
    expect(draft!.meta).toEqual({})
  })
})

describe('read/write/clear draft', () => {
  it('giữ nguyên dòng dở dang và trọng số người dùng đã gõ', () => {
    const store = new MemoryStore()
    const now = new Date('2026-11-16T08:30:00.000Z')
    writeCourseDraft(store, 's1', editorFixture(), { lop: 'D21-1' }, now)

    const draft = readCourseDraft(store, 's1')
    expect(draft).not.toBeNull()
    expect(draft!.savedAt).toBe(now.toISOString())
    expect(draft!.meta.lop).toBe('D21-1')
    expect(draft!.editor.cloList[0].maClo).toBe('')
    expect(draft!.editor.cloList[0].noiDung).toBe('đang viết dở')
    expect(draft!.editor.keHoachDanhGia[0].trongSoPhanTram).toBe(33.5)
  })

  it('khoá nháp tách theo môn', () => {
    const store = new MemoryStore()
    writeCourseDraft(store, 's1', editorFixture(), {})
    expect(draftKey('s1')).toBe('course-draft-s1')
    expect(readCourseDraft(store, 's2')).toBeNull()
  })

  it('xoá nháp', () => {
    const store = new MemoryStore()
    writeCourseDraft(store, 's1', editorFixture(), {})
    clearCourseDraft(store, 's1')
    expect(readCourseDraft(store, 's1')).toBeNull()
  })
})
