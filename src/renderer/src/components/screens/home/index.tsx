import React from 'react'
import { BookOpen, ChartColumn, FileSpreadsheet, FolderPlus, Play, Users } from 'lucide-react'
import { useWorkspace } from '@renderer/hooks/workspace'
import { hasBridge } from '@renderer/lib/theme'
import { formatPercent } from '@renderer/lib/format'
import type { ScreenId } from '@renderer/lib/navigation'
import { buildHomeOverview } from '@renderer/components/screens/home/overview-data'
import { OverviewGrid } from '@renderer/components/screens/home/overview-grid'
import { RecentActivity } from '@renderer/components/screens/home/recent-activity'
import { ActionCard, StatTile } from '@renderer/components/screens/home/widgets'

export function TrangChu({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { ws, loading, setActiveSession } = useWorkspace()
  const bridgeReady = hasBridge()

  async function createSamples(): Promise<void> {
    if (!bridgeReady) return
    try {
      const dir = await window.api.pickDirectory()
      if (!dir) return
      const created = await window.api.createSamples(dir)
      if (!created.ok) throw new Error(created.error ?? 'Không tạo được file mẫu.')
      await window.api.openPath(created.dir)
    } catch (err) {
      console.error(err)
    }
  }

  const sessions = ws?.sessions ?? []
  const { activities, totalStudents, totalRuns, avgPass, passByCourse, attention } =
    buildHomeOverview(sessions)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold">Xin chào! 👋</h2>
        <p className="text-muted-foreground/80 mt-1 text-[13px]">
          Chọn một môn học hoặc tạo mới để bắt đầu đánh giá CLO/PLO theo QĐ 450.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Môn học" value={String(sessions.length)} hint="Đang quản lý" />
        <StatTile label="Sinh viên" value={String(totalStudents)} hint="Theo lần chạy gần nhất" />
        <StatTile label="Tỷ lệ đạt TB" value={formatPercent(avgPass)} hint="Trung bình các môn" />
        <StatTile label="Lần chạy" value={String(totalRuns)} hint="Đã lưu trong lịch sử" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon={FolderPlus}
          title="Thêm môn học"
          desc="Tạo cấu hình học phần mới với file Config"
          onClick={() => onScreen('courses')}
        />
        <ActionCard
          icon={Play}
          title="Nhập điểm"
          desc="Nạp file Config + điểm thô và tính CLO/PLO"
          onClick={() => onScreen('import')}
        />
        <ActionCard
          icon={Users}
          title="Xem sinh viên"
          desc="Danh sách sinh viên, lọc đạt/không đạt, xem vết điểm"
          onClick={() => onScreen('students')}
        />
        <ActionCard
          icon={ChartColumn}
          title="Xem báo cáo"
          desc="Thống kê, biểu đồ CLO/PLO và xuất báo cáo"
          onClick={() => onScreen('reports')}
        />
      </div>

      <OverviewGrid
        passByCourse={passByCourse}
        attention={attention}
        sessionCount={sessions.length}
        loading={loading}
        onOpenAttention={(item) => {
          setActiveSession(item.id)
          onScreen(item.screen)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={createSamples}
          className="bg-card ring-foreground/10 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 transition hover:shadow-sm"
        >
          <FileSpreadsheet className="text-muted-foreground size-4" />
          Tạo bộ file mẫu KTLT101
        </button>
      </div>

      <RecentActivity
        activities={activities}
        loading={loading}
        onOpen={(session) => {
          setActiveSession(session.id)
          onScreen('reports')
        }}
        onViewAll={() => onScreen('reports')}
      />

      {activities.length === 0 && !loading ? (
        <p className="text-muted-foreground/60 flex items-center gap-1.5 text-xs">
          <BookOpen className="size-3.5" />
          Mẹo: nhấp vào môn học ở đáy thanh bên để mở nhanh màn Nhập điểm.
        </p>
      ) : null}
    </div>
  )
}
