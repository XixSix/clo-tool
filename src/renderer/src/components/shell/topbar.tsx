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
          className="bg-card text-muted-foreground ring-border/70 hover:text-foreground relative flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition"
        >
          <Bell className="size-4.5" />
          <span className="bg-destructive ring-background absolute top-2 right-2 size-2 rounded-full ring-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="text-muted-foreground px-2 pt-1 pb-2 text-xs">Chưa có thông báo mới</p>
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
          className="bg-card ring-border/70 hover:bg-secondary flex h-11 shrink-0 items-center gap-2.5 rounded-full py-1.5 pr-3 pl-1.5 shadow-sm ring-1 transition"
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-[11px] font-bold">
            ĐTĐ
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight lg:flex">
            <span className="truncate text-[13px] font-semibold">Đại học Thành Đông</span>
            <span className="text-muted-foreground text-[11px]">Quản lý học phần</span>
          </span>
          <ChevronsUpDown className="text-muted-foreground size-3.5" />
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
function CourseSwitcher({
  onScreen
}: {
  onScreen: (s: ScreenId) => void
}): React.ReactElement | null {
  const { ws, active, setActiveSession } = useWorkspace()
  if (!active) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="bg-secondary text-secondary-foreground hover:bg-muted flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium transition"
          title="Đổi môn học hiện tại"
        >
          <span className="max-w-40 truncate font-mono">{active.maHp}</span>
          <ChevronsUpDown className="text-muted-foreground size-3" />
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
            <span className="text-muted-foreground line-clamp-1 text-xs">{s.courseName}</span>
          </DropdownMenuItem>
        ))}
        {(ws?.sessions.length ?? 0) === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">Chưa có môn học nào</p>
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
    <header className="border-border/60 flex items-center gap-4 border-b px-6 pt-9 pb-4 [-webkit-app-region:drag]">
      {/* Nút đóng/mở sidebar — trên topbar, mọi kích thước màn hình */}
      <SidebarTrigger className="bg-card text-muted-foreground ring-border/70 hover:bg-secondary hover:text-foreground size-9 shrink-0 rounded-full shadow-sm ring-1 [-webkit-app-region:no-drag]" />

      <div className="min-w-0 [-webkit-app-region:no-drag]">
        <div className="flex items-center gap-2">
          <h1 className="text-foreground truncate text-2xl font-bold tracking-tight">
            {SCREEN_TITLES[screen]}
          </h1>
          {COURSE_SCOPED.includes(screen) ? <CourseSwitcher onScreen={onScreen} /> : null}
        </div>
        <p className="text-muted-foreground mt-0.5 text-[13px]">{formatToday()}</p>
      </div>

      <div className="flex-1" />

      {/* Search pill — chỉ giao diện, placeholder */}
      <div className="bg-card ring-border/70 focus-within:ring-primary/40 hidden h-11 w-72 items-center gap-2.5 rounded-full px-4 shadow-sm ring-1 transition focus-within:ring-2 min-[900px]:flex [-webkit-app-region:no-drag]">
        <Search className="text-muted-foreground size-4 shrink-0" />
        <Input
          aria-label="Tìm kiếm"
          placeholder="Tìm môn học, báo cáo…"
          className="h-full border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      <div className="flex items-center gap-2 [-webkit-app-region:no-drag]">
        {!bridgeReady ? (
          <span className="bg-warning/15 text-warning hidden rounded-full px-2.5 py-1 text-[11px] font-medium xl:block">
            Web preview
          </span>
        ) : null}
        <ThemeToggle />
        <NotificationBell />
        <ProfileBadge onScreen={onScreen} />
      </div>
    </header>
  )
}
