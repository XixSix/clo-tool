import React from 'react'
import { Bell, ChevronsUpDown, CircleHelp, Plus, Search, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import { Input } from '@renderer/components/ui/input'
import { SidebarTrigger } from '@renderer/components/ui/sidebar'
import { hasBridge } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/hooks/workspace'
import { COURSE_SCOPED, SCREEN_TITLES, type ScreenId } from '@renderer/lib/navigation'
import { ThemeToggle } from '@renderer/components/shell/theme-toggle'

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

/** Topbar: tiêu đề + ngày, search pill, theme, chuông, profile */
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
