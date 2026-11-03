import React from 'react'
import { Check } from 'lucide-react'
import { cn } from 'cn'

/** Ô số liệu mini dùng chung cho kết quả */
export function StatBox({
  value,
  label,
  tone = 'default'
}: {
  value: string | number
  label: string
  tone?: 'default' | 'success' | 'warning'
}): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg p-3 text-center',
        tone === 'success' && 'bg-success/10',
        tone === 'warning' && 'bg-warning/10',
        tone === 'default' && 'bg-muted'
      )}
    >
      <div
        className={cn(
          'text-xl font-bold',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'default' && 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  )
}

/** Một mục trong checklist "sẵn sàng chạy" */
export function ReadyItem({
  ok,
  label,
  value
}: {
  ok: boolean
  label: string
  value: string
}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg px-3 py-2 ring-1',
        ok ? 'bg-success/5 ring-success/30' : 'bg-muted ring-border'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
          ok
            ? 'bg-success text-success-foreground'
            : 'border-muted-foreground/50 border border-dashed'
        )}
      >
        {ok ? <Check className="size-3" /> : null}
      </span>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
        <p
          className={cn('truncate text-xs font-medium', !ok && 'text-muted-foreground')}
          title={value}
        >
          {ok ? value : 'Chưa chọn'}
        </p>
      </div>
    </div>
  )
}
