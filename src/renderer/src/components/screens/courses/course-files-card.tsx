import React from 'react'
import { FileSpreadsheet, FolderOpen } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import type { SessionDto } from '../../../../../shared/ipc'

/** Card "Tệp đang dùng" — đường dẫn bảng điểm và thư mục báo cáo của môn. */
export function CourseFilesCard({ session }: { session: SessionDto }): React.ReactElement {
  const files = [
    { label: 'Bảng điểm sinh viên', path: session.gradeSheetPath },
    { label: 'Thư mục báo cáo', path: session.outDir }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Tệp đang dùng</CardTitle>
        <CardDescription>File bảng điểm và thư mục báo cáo</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {files.map((item) => (
          <div key={item.label} className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
            <FileSpreadsheet className="text-muted-foreground size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="truncate text-[13px]" title={item.path}>
                {item.path ? item.path.split(/[\\/]/).pop() : 'Chưa chọn'}
              </p>
            </div>
            {item.path ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={`Mở ${item.label}`}
                onClick={() => window.api.openPath(item.path!)}
              >
                <FolderOpen />
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
