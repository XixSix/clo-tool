import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from 'cn'
import { formatPercent } from '@renderer/lib/format'
import { timeAgo } from '@renderer/lib/time'
import type { SessionDto } from '../../../../../shared/ipc'

interface ActionCardProps {
  icon: React.ElementType
  title: string
  desc: string
  onClick: () => void
}

export function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick
}: ActionCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-card ring-foreground/10 hover:ring-primary/50 flex flex-col gap-1.5 rounded-xl p-5 text-left ring-1 transition hover:shadow-md"
    >
      <Icon className="text-primary size-5" />
      <p className="text-foreground text-sm font-semibold">{title}</p>
      <p className="text-muted-foreground/80 text-xs">{desc}</p>
    </button>
  )
}

export function ActivityRow({
  session,
  ts,
  onOpen
}: {
  session: SessionDto
  ts: number
  onOpen: () => void
}): React.ReactElement {
  const run = session.history[session.history.length - 1]
  const achieved = run ? run.passedPercent >= 60 : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-card ring-foreground/10 hover:ring-primary/40 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 transition hover:shadow-sm"
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          achieved === null ? 'bg-muted-foreground/40' : achieved ? 'bg-success' : 'bg-destructive'
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">
          {session.maHp} — {session.courseName}
        </p>
        <p className="text-muted-foreground/70 text-[11px]">
          {session.lop ? `${session.lop} · ` : ''}
          {run
            ? `${run.studentCount} SV · ${formatPercent(run.passedPercent)} đạt`
            : `${session.soTinChi} tín chỉ · chưa chạy`}
        </p>
      </div>
      <span className="text-muted-foreground/60 shrink-0 text-[11px]">{timeAgo(ts)}</span>
      <ChevronRight className="text-muted-foreground/50 size-3.5 shrink-0" />
    </button>
  )
}

export function StatTile({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}): React.ReactElement {
  return (
    <div className="bg-card ring-foreground/10 rounded-xl p-4 ring-1">
      <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p> : null}
    </div>
  )
}
