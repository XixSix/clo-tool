import React from 'react'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@renderer/components/ui/table'
import { formatScore } from '@renderer/lib/format'
import type { StudentRow } from '@renderer/hooks/use-student-filters'
import type { ProcessedStudentResultView } from '@renderer/lib/result-view'

function ScoreCell({ value }: { value: number | undefined }): React.ReactElement {
  return <span className="font-mono text-[13px] tabular-nums">{formatScore(value)}</span>
}

/** Bảng danh sách sinh viên — nhấn dòng để mở sheet chi tiết. */
export function StudentTable({
  rows,
  loading,
  onSelect
}: {
  rows: StudentRow[]
  loading: boolean
  onSelect: (student: ProcessedStudentResultView) => void
}): React.ReactElement {
  return (
    <div className="bg-card ring-foreground/10 overflow-hidden rounded-xl ring-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">TT</TableHead>
            <TableHead className="w-28">Mã SV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead className="text-right">CC</TableHead>
            <TableHead className="text-right">GK</TableHead>
            <TableHead className="text-right">CK</TableHead>
            <TableHead className="text-right">TBC CLO</TableHead>
            <TableHead className="text-right">Điểm HP</TableHead>
            <TableHead className="w-28">Kết quả</TableHead>
            <TableHead className="w-24 text-center">CLO đạt</TableHead>
            <TableHead className="w-16 text-center">Lưu ý</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <TableRow key={idx}>
                <TableCell colSpan={11}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-muted-foreground h-32 text-center text-sm">
                Không tìm thấy sinh viên phù hợp bộ lọc.
              </TableCell>
            </TableRow>
          ) : (
            rows.map(({ student, passedClos, totalClos }) => (
              <TableRow
                key={student.maSv}
                className="cursor-pointer"
                onClick={() => onSelect(student)}
              >
                <TableCell className="text-muted-foreground text-xs">{student.tt}</TableCell>
                <TableCell className="font-mono text-[13px]">{student.maSv}</TableCell>
                <TableCell>
                  <p className="text-[13px] font-medium">{student.hoTen}</p>
                  {student.maDe ? (
                    <p className="text-muted-foreground text-[11px]">Đề {student.maDe}</p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <ScoreCell value={student.groupScores.CC?.score} />
                </TableCell>
                <TableCell className="text-right">
                  <ScoreCell value={student.groupScores.GK?.score} />
                </TableCell>
                <TableCell className="text-right">
                  <ScoreCell value={student.groupScores.CK?.score} />
                </TableCell>
                <TableCell className="text-right">
                  <ScoreCell value={student.tbcClo} />
                </TableCell>
                <TableCell className="text-right font-mono text-[13px] font-semibold">
                  {formatScore(student.courseScore)}
                </TableCell>
                <TableCell>
                  {student.isPassedHp ? (
                    <Badge variant="secondary">Đạt</Badge>
                  ) : (
                    <Badge variant="destructive">Không đạt</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {passedClos}/{totalClos}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {student.isAbsentFinal || student.hasMissingData || student.issues.length > 0 ? (
                    <TriangleAlert
                      className={
                        student.isAbsentFinal || student.hasMissingData
                          ? 'text-destructive mx-auto size-4'
                          : 'text-warning mx-auto size-4'
                      }
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
