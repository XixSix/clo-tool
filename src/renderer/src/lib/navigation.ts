/** Điều hướng màn hình dùng chung — tách khỏi app-shell để screens không import ngược lên shell. */

export type ScreenId =
  | 'home'
  | 'courses'
  | 'students'
  | 'reports'
  | 'import'
  | 'settings'
  | 'guide'

export const SCREEN_TITLES: Record<ScreenId, string> = {
  home: 'Trang chủ',
  courses: 'Môn học',
  students: 'Sinh viên',
  reports: 'Báo cáo',
  import: 'Nhập điểm',
  settings: 'Cài đặt',
  guide: 'Hướng dẫn'
}

/** Các màn gắn với "môn học hiện tại" — topbar hiện chip đổi môn */
export const COURSE_SCOPED: ScreenId[] = ['students', 'reports', 'import']
