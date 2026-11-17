import React from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@renderer/components/ui/field'
import { COLOR_THEMES, useTheme } from '@renderer/lib/theme'
import { cn } from 'cn'
import { useAppVersion } from '@renderer/hooks/use-app-version'
import { DangerZone } from '@renderer/components/screens/settings/danger-zone'
import { UpdateCard } from '@renderer/components/screens/settings/update-card'

export function CaiDat(): React.ReactElement {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme()
  const version = useAppVersion()

  const optionRef = (next: 'light' | 'dark') => () => setTheme(next)

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Giao diện</CardTitle>
          <CardDescription>Chọn chế độ sáng hoặc tối</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="theme-choice">Chủ đề</FieldLabel>
              <div id="theme-choice" className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={optionRef('light')}
                >
                  <Sun data-icon="inline-start" />
                  Sáng
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={optionRef('dark')}
                >
                  <Moon data-icon="inline-start" />
                  Tối
                </Button>
              </div>
              <FieldDescription>Chủ đề được ghi nhớ giữa các lần mở app.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Bảng màu</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((option) => {
                  const active = colorTheme === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setColorTheme(option.id)}
                      className={cn(
                        'border-border flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                        active ? 'border-primary ring-primary/25 ring-2' : 'hover:bg-accent/50'
                      )}
                    >
                      <span className="flex shrink-0 gap-1">
                        {option.swatch.map((color) => (
                          <span
                            key={color}
                            className="size-3 rounded-full border border-black/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  )
                })}
              </div>
              <FieldDescription>
                Bảng màu áp dụng cho cả chế độ Sáng và Tối; “Mặc định” là tông trung tính gốc.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Về phần mềm</CardTitle>
          <CardDescription>
            Đo lường &amp; đánh giá chuẩn đầu ra học phần theo QĐ 450/QĐ-ĐHTĐ (07/8/2024)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Offline 100%</Badge>
          <Badge variant="secondary">{version ? `v${version}` : '—'}</Badge>
          <Badge variant="secondary">Đại học Thành Đông</Badge>
        </CardContent>
      </Card>

      <UpdateCard version={version} />

      <DangerZone />
    </div>
  )
}
