/**
 * Vẽ biểu đồ cột PNG (offline) để chèn vào file Excel.
 *
 * ExcelJS không tạo được biểu đồ Excel gốc, nên app vẽ ảnh PNG bằng @napi-rs/canvas
 * (không cần cài đặt thêm runtime/cairo). Dữ liệu nguồn vẫn được ghi thành bảng cạnh ảnh.
 */

import { createCanvas, GlobalFonts } from '@napi-rs/canvas'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface BarChartOptions {
  title: string
  labels: string[]
  values: number[]
  /** Giá trị lớn nhất của trục tung (mặc định 100 cho %) */
  maxValue?: number
  barColor?: string
  /** Nhãn đơn vị hiển thị trên đầu cột */
  valueSuffix?: string
  width?: number
  height?: number
}

let fontRegistered = false

function ensureFont(): string {
  if (!fontRegistered) {
    const candidates = [
      'C:\\Windows\\Fonts\\segoeui.ttf',
      'C:\\Windows\\Fonts\\arial.ttf',
      join(process.cwd(), 'resources', 'fonts', 'NotoSans-Regular.ttf')
    ]
    for (const file of candidates) {
      if (existsSync(file)) {
        try {
          GlobalFonts.registerFromPath(file, 'AppFont')
          break
        } catch {
          // thử font khác
        }
      }
    }
    fontRegistered = true
  }
  return 'AppFont'
}

export function renderBarChartPng(options: BarChartOptions): Buffer {
  const {
    title,
    labels,
    values,
    maxValue = 100,
    barColor = '#2563eb',
    valueSuffix = '',
    width = 900,
    height = 420
  } = options

  const font = ensureFont()
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Nền trắng
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  const padding = { top: 70, right: 40, bottom: 70, left: 60 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  // Tiêu đề
  ctx.fillStyle = '#0f172a'
  ctx.font = `bold 22px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(title, width / 2, 34)

  // Trục & lưới ngang
  const ticks = 5
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.fillStyle = '#64748b'
  ctx.font = `13px ${font}`
  ctx.textAlign = 'right'
  for (let i = 0; i <= ticks; i++) {
    const value = (maxValue / ticks) * i
    const y = padding.top + plotHeight - (plotHeight / ticks) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + plotWidth, y)
    ctx.stroke()
    ctx.fillText(`${Math.round(value)}`, padding.left - 10, y)
  }

  // Cột
  const n = Math.max(values.length, 1)
  const slot = plotWidth / n
  const barWidth = Math.min(64, slot * 0.55)

  values.forEach((value, i) => {
    const clamped = Math.max(0, Math.min(value, maxValue))
    const barHeight = (clamped / maxValue) * plotHeight
    const x = padding.left + slot * i + (slot - barWidth) / 2
    const y = padding.top + plotHeight - barHeight

    // Gradient nhẹ
    const gradient = ctx.createLinearGradient(0, y, 0, padding.top + plotHeight)
    gradient.addColorStop(0, barColor)
    gradient.addColorStop(1, '#93c5fd')
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)

    // Giá trị trên đầu cột
    ctx.fillStyle = '#0f172a'
    ctx.font = `bold 13px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    const label = Number.isInteger(value) ? `${value}` : value.toFixed(1)
    ctx.fillText(`${label}${valueSuffix}`, x + barWidth / 2, y - 6)

    // Nhãn trục X
    ctx.fillStyle = '#334155'
    ctx.font = `13px ${font}`
    ctx.textBaseline = 'top'
    ctx.fillText(labels[i] ?? '', x + barWidth / 2, padding.top + plotHeight + 12)
  })

  // Đường trục tung
  ctx.strokeStyle = '#94a3b8'
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + plotHeight)
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}
