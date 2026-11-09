import React from 'react'
import { ShieldCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { Skeleton } from '@renderer/components/ui/skeleton'
import { toCourseView } from '@renderer/lib/result-view'
import type { RunSnapshotDto } from '../../../../../shared/ipc'

/** Card "Cấu hình CLO / đầu điểm" đọc từ snapshot lần chạy gần nhất. */
export function CourseCloCard({
  snapshot,
  loading
}: {
  snapshot: RunSnapshotDto | null
  loading: boolean
}): React.ReactElement {
  const courseView = snapshot ? toCourseView(snapshot.config) : null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cấu hình CLO / đầu điểm</CardTitle>
        <CardDescription>
          Đọc từ snapshot lần chạy gần nhất — nguồn chính vẫn là file Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        ) : !courseView ? (
          <Empty className="border-none">
            <EmptyHeader>
              <ShieldCheck className="text-muted-foreground/40" />
              <EmptyTitle>Chưa có cấu hình chi tiết</EmptyTitle>
              <EmptyDescription>
                Chạy “Nhập điểm” một lần để ứng dụng lưu lại cấu hình CLO, đầu điểm và quy tắc của
                học phần.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {courseView.cloList.map((clo) => (
                <Badge key={clo.maClo} variant="secondary" title={clo.noiDung}>
                  {clo.maClo}
                  {courseView.courseInfo.loaiHp === 'thuc_hanh' && clo.trongSoClo
                    ? ` · ${clo.trongSoClo}%`
                    : ''}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground">Đầu điểm</p>
                <p className="mt-1 text-lg font-semibold">{courseView.keHoachDanhGia.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground">Câu hỏi</p>
                <p className="mt-1 text-lg font-semibold">{courseView.cauHoi.length}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground">Ánh xạ PLO</p>
                <p className="mt-1 text-lg font-semibold">{courseView.maTranPlo.length}</p>
              </div>
            </div>

            <div className="ring-foreground/10 overflow-hidden rounded-lg ring-1">
              {courseView.keHoachDanhGia.map((item) => (
                <div
                  key={`${item.nhom}-${item.maDauDiem}-${item.clo}`}
                  className="border-border/60 flex items-center gap-2 border-b px-3 py-2 text-xs last:border-0"
                >
                  <Badge variant="outline" className="font-mono">
                    {item.maDauDiem}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate">{item.thanhPhan}</span>
                  <span className="text-muted-foreground">{item.clo}</span>
                  <span className="w-12 text-right font-mono">{item.trongSoPhanTram}%</span>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground text-xs">
              Ngưỡng đạt: CLO {courseView.quyTac.nguongDatClo} · PLO{' '}
              {courseView.quyTac.nguongDatPlo} · Học phần {courseView.quyTac.nguongDatHp} · Phương
              thức {courseView.quyTac.phuongThucTinhHp}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
