import React from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { Badge } from '@renderer/components/ui/badge'

const STEPS = [
  {
    title: '1. Chuẩn bị file Config',
    desc: 'Tạo file Template_Config.xlsx khai báo học phần: mã môn, số tín chỉ, danh sách CLO + trọng số, các đầu điểm và cấu trúc từng đề thi (mã đầu điểm, mã đề, cột điểm, trọng số). Lưu ý: mỗi mã đầu điểm + mã đề phải cho tổng điểm tối đa đúng bằng 10.'
  },
  {
    title: '2. Nhập file điểm thô',
    desc: 'File Template_DiemTho.xlsx chứa 1 sheet mỗi lớp: điểm danh các buổi, điểm từng cột theo cấu trúc đã khai báo. Số cột phải khớp với cấu trúc đề, và tổng tối đa cũng phải bằng 10.'
  },
  {
    title: '3. Chạy tính toán',
    desc: 'Bấm “Tính toán & xuất báo cáo”. Phần mềm tính điểm theo QĐ 450 với decimal ROUND_HALF_UP, sinh 2 file Excel: bảng điểm từng sinh viên theo CLO/PLO và phân tích psychometric từng đề (tần suất đạt, trung bình, Cronbach α, độ phân biệt).'
  },
  {
    title: '4. Đọc kết quả',
    desc: 'Mỗi CLO được đánh giá “Đạt / Không đạt” theo ngưỡng cấu hình. Ở danh sách cột điểm: ô có cảnh báo vàng = dữ liệu thiếu hoặc vắng thi; cột điểm trống được quy ước 0 điểm (Quyết định #9) nhưng vẫn giữ trọng số trong mẫu số.'
  }
]

const RULE_BADGES = [
  'Mã SV trống = tự sinh theo thứ tự xuất hiện',
  'VT = vắng thi → 0 CK, loại khỏi p/d/α',
  'Cột trống = 0 điểm, có cảnh báo',
  'Làm mọi đề = mã đề ALL'
]

export function HuongDan(): React.ReactElement {
  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-xl font-bold">Hướng dẫn nhanh</h2>
        <p className="text-muted-foreground/80 mt-1 text-[13px]">
          Quy trình 4 bước để tạo báo cáo đánh giá CLO/PLO cho một học phần.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-primary text-sm font-semibold">{step.title}</CardTitle>
              <CardDescription className="text-[13px] leading-relaxed">{step.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <h3 className="text-muted-foreground mt-5 mb-2 text-xs font-semibold tracking-wide uppercase">
        Quy ước dữ liệu
      </h3>
      <div className="flex flex-wrap gap-2">
        {RULE_BADGES.map((rule) => (
          <Badge key={rule} variant="secondary" className="font-normal">
            {rule}
          </Badge>
        ))}
      </div>

      <Separator className="my-5" />
      <p className="text-muted-foreground/70 text-xs">
        Chi tiết đặc tả business: <span className="font-mono">docs/ke_hoach_dac_ta_clo_plo.md</span>{' '}
        trong thư mục dự án.
      </p>
    </div>
  )
}
