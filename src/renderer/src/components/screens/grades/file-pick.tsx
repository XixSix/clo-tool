import React from 'react'
import { cn } from 'cn'

/** Lấy tên file cuối cùng từ đường dẫn tuyệt đối. */
export function fileName(path: string | undefined): string {
  if (!path) return ''
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || path
}

/** Nút chọn file gốc dùng cho Bước 1 & 2 */
export function FilePick({
  label,
  path,
  onClick,
  disabled
}: {
  label: string
  path: string
  onClick: () => void
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full truncate rounded-lg border border-dashed px-3 py-3 text-left text-sm transition',
        disabled && 'cursor-not-allowed opacity-60',
        path
          ? 'border-border bg-muted text-foreground'
          : 'border-border bg-transparent text-muted-foreground',
        !disabled && !path && 'hover:border-primary hover:bg-accent/50'
      )}
      title={path || label}
    >
      {path ? `📄 ${fileName(path)}` : label}
    </button>
  )
}
