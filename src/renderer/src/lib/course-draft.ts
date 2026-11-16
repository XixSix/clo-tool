/**
 * Bản nháp cấu hình môn — autosave tách khỏi cấu hình chính thức (IPC).
 *
 * Nháp giữ nguyên dữ liệu editor, kể cả dòng dở dang mà adapter sẽ bỏ khi chuyển
 * sang `Course` (CLO chưa có mã, dòng kế hoạch chưa chọn CLO, dòng PLO thiếu PI).
 * Nhờ vậy người dùng rời màn giữa lúc nhập vẫn không mất việc, còn nút "Lưu" chỉ
 * ghi cấu hình chính thức khi dữ liệu đã sạch lỗi.
 *
 * Thuần TS (không React) để test được ngoài renderer.
 */

import type { EditorConfig } from '../components/screens/courses/course-editor-types'

export interface CourseDraftMeta {
  lop?: string
  giangVien?: string
  namHoc?: string
}

export interface CourseDraft {
  editor: EditorConfig
  meta: CourseDraftMeta
  /** ISO timestamp của lần autosave gần nhất. */
  savedAt: string
}

/** Tối thiểu những gì cần có để không crash editor khi nạp lại. */
interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function draftKey(sessionId: string): string {
  return `course-draft-${sessionId}`
}

export function parseCourseDraft(raw: string | null): CourseDraft | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CourseDraft> | null
    if (!parsed || typeof parsed !== 'object') return null

    const editor = parsed.editor as Partial<EditorConfig> | undefined
    if (!editor || typeof editor !== 'object') return null
    if (!editor.courseInfo || typeof editor.courseInfo !== 'object') return null
    if (
      !Array.isArray(editor.cloList) ||
      !Array.isArray(editor.keHoachDanhGia) ||
      !Array.isArray(editor.cauHoi) ||
      !Array.isArray(editor.maTranPlo)
    ) {
      return null
    }

    const meta =
      parsed.meta && typeof parsed.meta === 'object'
        ? (parsed.meta as CourseDraftMeta)
        : {}
    const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date(0).toISOString()

    return { editor: editor as EditorConfig, meta, savedAt }
  } catch {
    return null
  }
}

export function readCourseDraft(store: KeyValueStore, sessionId: string): CourseDraft | null {
  try {
    return parseCourseDraft(store.getItem(draftKey(sessionId)))
  } catch {
    return null
  }
}

export function writeCourseDraft(
  store: KeyValueStore,
  sessionId: string,
  editor: EditorConfig,
  meta: CourseDraftMeta,
  now: Date = new Date()
): CourseDraft {
  const draft: CourseDraft = { editor, meta, savedAt: now.toISOString() }
  try {
    store.setItem(draftKey(sessionId), JSON.stringify(draft))
  } catch {
    // Hết quota / storage bị chặn: autosave là tiện ích, không được làm hỏng editor.
  }
  return draft
}

export function clearCourseDraft(store: KeyValueStore, sessionId: string): void {
  try {
    store.removeItem(draftKey(sessionId))
  } catch {
    // bỏ qua
  }
}
