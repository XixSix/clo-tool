import React, { useState } from 'react'
import { SidebarInset, SidebarProvider } from '@renderer/components/ui/sidebar'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { TooltipProvider } from '@renderer/components/ui/tooltip'
import { useWorkspace } from '@renderer/hooks/workspace'
import { COURSE_SCOPED, type ScreenId } from '@renderer/lib/navigation'
import { AppSidebar } from '@renderer/components/shell/sidebar'
import { AppTopbar } from '@renderer/components/shell/topbar'
import { TrangChu } from '@renderer/components/screens/home'
import { MonHoc } from '@renderer/components/screens/courses'
import { NhapDiem } from '@renderer/components/screens/grades'
import { SinhVien } from '@renderer/components/screens/students'
import { BaoCao } from '@renderer/components/screens/reports'
import { CaiDat } from '@renderer/components/screens/settings'
import { HuongDan } from '@renderer/components/screens/guide'

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
