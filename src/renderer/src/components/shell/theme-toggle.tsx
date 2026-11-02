import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from 'cn'
import { useTheme } from '@renderer/lib/theme'

/** Công tắc sáng/tối trên topbar — kích thước và kiểu dáng đồng bộ với các pill khác. */
export function ThemeToggle(): React.ReactElement {
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
