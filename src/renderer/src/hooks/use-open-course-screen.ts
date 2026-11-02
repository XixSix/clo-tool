import { useWorkspace } from '@renderer/hooks/workspace'
import type { ScreenId } from '@renderer/lib/navigation'
import type { SessionDto } from '../../../shared/ipc'

/** Mở màn gắn với môn: đặt môn hiện tại rồi chuyển màn. */
export function useOpenCourseScreen(
  onScreen: (s: ScreenId) => void
): (session: SessionDto, screen: ScreenId) => void {
  const { setActiveSession } = useWorkspace()
  return (session, screen) => {
    setActiveSession(session.id)
    onScreen(screen)
  }
}
