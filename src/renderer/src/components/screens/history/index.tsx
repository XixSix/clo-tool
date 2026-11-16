import React from 'react'
import { LichSu } from '@renderer/components/history-panel'

/** Màn lịch sử toàn cục: mọi lần chạy của tất cả môn học. */
export function LichSuScreen(): React.ReactElement {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">Lịch sử chạy</h2>
        <p className="text-muted-foreground/80 text-[13px]">
          Tổng hợp các lần nhập điểm và xuất báo cáo của mọi môn học.
        </p>
      </div>
      <LichSu />
    </div>
  )
}
