import React from 'react'
import {
  ArrowUpRight,
  BookOpen,
  ChartColumn,
  CircleHelp,
  House,
  Plus,
  Settings,
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@renderer/components/ui/sidebar'
import { cn } from 'cn'
import { useWorkspace } from '@renderer/hooks/workspace'
import type { ScreenId } from '@renderer/lib/navigation'

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

/** Sidebar panel card nổi (variant floating) theo thiết kế */
export function AppSidebar({
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
