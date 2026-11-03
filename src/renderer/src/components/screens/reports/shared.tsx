import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'

/** Ô KPI nhỏ ở đầu tab Tổng quan. */
export function Kpi({
  label,
  value,
  hint
}: {
  label: string
  value: string
  hint?: string
}): React.ReactElement {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="text-muted-foreground mt-0.5 text-[11px]">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

/** Card bọc một biểu đồ kèm tiêu đề + mô tả. */
export function ChartCard({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactElement
}): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
