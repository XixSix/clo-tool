import React, { useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  ChartColumn,
  ChevronsUpDown,
  CircleHelp,
  House,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Users
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@renderer/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Input } from '@renderer/components/ui/input'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { cn } from 'cn'
import { hasBridge, useTheme } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/lib/workspace'
import { TrangChu } from '@renderer/components/screens/home'
import { MonHoc } from '@renderer/components/screens/courses'
import { NhapDiem } from '@renderer/components/screens/grades'
import { SinhVien } from '@renderer/components/screens/students'
import { BaoCao } from '@renderer/components/screens/reports'
import { CaiDat } from '@renderer/components/screens/settings'
import { HuongDan } from '@renderer/components/screens/guide'

export type ScreenId =
  | 'home'
  | 'courses'
  | 'students'
  | 'reports'
  | 'import'
  | 'settings'
  | 'guide'

const SCREEN_TITLES: Record<ScreenId, string> = {
  home: 'Trang chủ',
  courses: 'Môn học',
  students: 'Sinh viên',
  reports: 'Báo cáo',
  import: 'Nhập điểm',
  settings: 'Cài đặt',
  guide: 'Hướng dẫn'
}

/** Các màn gắn với "môn học hiện tại" — topbar hiện chip đổi môn */
const COURSE_SCOPED: ScreenId[] = ['students', 'reports', 'import']

/* ============================================================
   TOPBAR — tiêu đề + ngày, search pill, theme, chuông, profile
   ============================================================ */

function ThemeToggle(): React.ReactElement {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className="flex items-center rounded-full bg-card p-1 shadow-sm ring-1 ring-border/70"
      role="group"
      aria-label="Chọn chủ đề"
    >
      <button
        type="button"
        aria-label="Chế độ sáng"
        onClick={() => setTheme('light')}
        className={cn(
          'flex size-8 items-center justify-center rounded-full transition',
          theme === 'light'
            ? 'bg-secondary text-foreground ring-1 ring-border/60'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sun className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Chế độ tối"
        onClick={() => setTheme('dark')}
        className={cn(
          'flex size-8 items-center justify-center rounded-full transition',
          theme === 'dark'
            ? 'bg-secondary text-foreground ring-1 ring-border/60'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Moon className="size-4" />
      </button>
    </div>
  )
}

/** Nút chuông thông báo — place holder với chấm đỏ, popover "chưa có mới" */
function NotificationBell(): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Thông báo"
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 transition hover:text-foreground"
        >
          <Bell className="size-4.5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2 pb-2 pt-1 text-xs text-muted-foreground">Chưa có thông báo mới</p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Badge user — avatar + tên + vai trò, nhấn ra menu nhanh */
function ProfileBadge({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Tài khoản"
          className="flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-card py-1.5 pr-3 pl-1.5 shadow-sm ring-1 ring-border/70 transition hover:bg-secondary"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            ĐTĐ
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
            <span className="truncate text-[13px] font-semibold">Đại học Thành Đông</span>
            <span className="text-[11px] text-muted-foreground">Quản lý học phần</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onScreen('guide')}>
          <CircleHelp />
          Hướng dẫn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onScreen('settings')}>
          <Settings />
          Cài đặt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatToday(): string {
  const label = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Chip đổi "môn học hiện tại" — đặt cạnh tiêu đề ở các màn gắn với môn */
function CourseSwitcher({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement | null {
  const { ws, active, setActiveSession } = useWorkspace()
  if (!active) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-[12px] font-medium text-secondary-foreground transition hover:bg-muted"
          title="Đổi môn học hiện tại"
        >
          <span className="max-w-40 truncate font-mono">{active.maHp}</span>
          <ChevronsUpDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Môn học hiện tại</DropdownMenuLabel>
        {(ws?.sessions ?? []).map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setActiveSession(s.id)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="font-mono text-xs font-semibold">
              {s.maHp}
              {s.lop ? ` · ${s.lop}` : ''}
            </span>
            <span className="line-clamp-1 text-xs text-muted-foreground">{s.courseName}</span>
          </DropdownMenuItem>
        ))}
        {(ws?.sessions.length ?? 0) === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Chưa có môn học nào</p>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onScreen('courses')}>
          <Plus />
          Quản lý môn học
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppTopbar({
  screen,
  onScreen
}: {
  screen: ScreenId
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  const bridgeReady = hasBridge()
  return (
    <header className="flex items-center gap-4 border-b border-border/60 px-6 pt-5 pb-4">
      {/* Nút đóng/mở sidebar — trên topbar, mọi kích thước màn hình */}
      <SidebarTrigger className="size-9 shrink-0 rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border/70 hover:bg-secondary hover:text-foreground" />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
            {SCREEN_TITLES[screen]}
          </h1>
          {COURSE_SCOPED.includes(screen) ? <CourseSwitcher onScreen={onScreen} /> : null}
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{formatToday()}</p>
      </div>

      <div className="flex-1" />

      {/* Search pill — chỉ giao diện, placeholder */}
      <div className="hidden h-11 w-72 items-center gap-2.5 rounded-full bg-card px-4 shadow-sm ring-1 ring-border/70 transition focus-within:ring-2 focus-within:ring-primary/40 min-[900px]:flex">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          aria-label="Tìm kiếm"
          placeholder="Tìm môn học, báo cáo…"
          className="h-full border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      {!bridgeReady ? (
        <span className="hidden rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning xl:block">
          Web preview
        </span>
      ) : null}

      <ThemeToggle />
      <NotificationBell />
      <ProfileBadge onScreen={onScreen} />
    </header>
  )
}

/* ============================================================
   SIDEBAR — panel card nổi (variant floating) theo thiết kế
   ============================================================ */

const MAIN_NAV: { id: ScreenId; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Trang chủ', icon: House },
  { id: 'courses', label: 'Môn học', icon: BookOpen },
  { id: 'students', label: 'Sinh viên', icon: Users },
  { id: 'reports', label: 'Báo cáo', icon: ChartColumn }
]

/** Chỉ chỉnh kích thước/căn giữa; trạng thái active tô màu thủ công (không dùng prop isActive của kit) */
function navButtonClass(isActive: boolean): string {
  return cn(
    'h-10 rounded-lg [&_svg]:size-4.5 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:[&_svg]:size-4',
    isActive
      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      : undefined
  )
}

/** Widget nổi bật "MÔN HỌC HIỆN TẠI" — card gradient primary giống callout */
function CurrentCourseCard({ onOpen }: { onOpen: (s: ScreenId) => void }): React.ReactElement {
  const { active, loading } = useWorkspace()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  if (loading) {
    return <p className="px-1 py-2 text-[11px] text-muted-foreground/60">Đang tải…</p>
  }

  if (!active) {
    if (collapsed) return <></>
    return (
      <button
        type="button"
        onClick={() => onOpen('courses')}
        className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 px-3.5 py-3 text-left text-[12px] font-medium text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
      >
        <Plus className="size-4.5 shrink-0 text-primary" />
        Thêm môn học đầu tiên
      </button>
    )
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => onOpen('import')}
        title={`${active.maHp} — ${active.courseName}`}
        className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-primary-foreground shadow-sm transition hover:shadow-md"
      >
        <span className="font-mono text-xs font-bold">{active.maHp.slice(0, 2)}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen('import')}
      className="group w-full rounded-2xl bg-primary px-3.5 py-3.5 text-left text-primary-foreground shadow-md transition hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide">
          {active.maHp}
        </span>
        <ArrowUpRight className="size-4 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug">
        {active.courseName}
      </p>
      <p className="mt-2 text-[11px] font-medium text-primary-foreground/75">
        {active.cloCount ? `${active.cloCount} CLO` : '—'}
        <span className="px-1.5 opacity-60">•</span>
        {active.soTinChi} tín chỉ
      </p>
    </button>
  )
}

function AppSidebar({
  screen,
  onScreen
}: {
  screen: ScreenId
  onScreen: (s: ScreenId) => void
}): React.ReactElement {
  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="p-3 [&_[data-slot=sidebar-inner]]:rounded-[1.25rem] [&_[data-slot=sidebar-inner]]:ring-sidebar-border/60 [&_[data-slot=sidebar-inner]]:shadow-sm"
    >
      <SidebarHeader>
        {/* Brand block — khi thu gọn chỉ còn logo ở giữa */}
        <div className="group flex items-center gap-2.5 px-1 pt-1 pb-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[15px] font-bold text-primary-foreground shadow-sm">
            C
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[15px] leading-tight font-bold">CLO Evaluator</p>
            <p className="truncate text-[11px] text-muted-foreground">Đại học Thành Đông</p>
          </div>
          <span className="flex-1 group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2.5 text-[10px] font-semibold tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
            MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    onClick={() => onScreen(item.id)}
                    className={navButtonClass(screen === item.id)}
                  >
                    <item.icon />
                    <span className="text-[13px]">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-2 pt-1 pb-3 group-data-[collapsible=icon]:px-0">
        {/* Widget môn hiện tại */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-1 text-[10px] font-semibold tracking-widest text-muted-foreground/60 group-data-[collapsible=icon]:hidden">
            MÔN HỌC HIỆN TẠI
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <CurrentCourseCard onOpen={onScreen} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Nav đáy: Hướng dẫn + Cài đặt */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Hướng dẫn"
                  onClick={() => onScreen('guide')}
                  className={navButtonClass(screen === 'guide')}
                >
                  <CircleHelp />
                  <span className="text-[13px]">Hướng dẫn</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Cài đặt"
                  onClick={() => onScreen('settings')}
                  className={navButtonClass(screen === 'settings')}
                >
                  <Settings />
                  <span className="text-[13px]">Cài đặt</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function AppShell(): React.ReactElement {
  const [screen, setScreen] = useState<ScreenId>('home')
  const { active, loading } = useWorkspace()
  const waitingCourse = loading && COURSE_SCOPED.includes(screen)

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider
        /* Rộng hơn default 3rem để icon thu gọn có khoảng thở */
        style={{ '--sidebar-width-icon': '3.75rem' } as React.CSSProperties}
      >
        <AppSidebar screen={screen} onScreen={setScreen} />
        <SidebarInset className="bg-background">
          <AppTopbar screen={screen} onScreen={setScreen} />
          <main className="flex-1 overflow-auto px-6 pb-6">
            {waitingCourse ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
                <Skeleton className="h-72 rounded-xl" />
              </div>
            ) : null}
            {!waitingCourse && screen === 'home' ? <TrangChu onScreen={setScreen} /> : null}
            {!waitingCourse && screen === 'courses' ? <MonHoc onScreen={setScreen} /> : null}
            {!waitingCourse && screen === 'students' ? (
              <SinhVien key={active?.id ?? 'none'} onScreen={setScreen} />
            ) : null}
            {!waitingCourse && screen === 'reports' ? (
              <BaoCao key={active?.id ?? 'none'} onScreen={setScreen} />
            ) : null}
            {!waitingCourse && screen === 'import' ? (
              <NhapDiem key={active?.id ?? 'none'} onScreen={setScreen} />
            ) : null}
            {!waitingCourse && screen === 'settings' ? <CaiDat /> : null}
            {!waitingCourse && screen === 'guide' ? <HuongDan /> : null}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
