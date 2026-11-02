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
import { useTheme } from '@renderer/lib/theme'
import { useAppVersion } from '@renderer/hooks/use-app-version'
import { DangerZone } from '@renderer/components/screens/settings/danger-zone'
import { UpdateCard } from '@renderer/components/screens/settings/update-card'

export function CaiDat(): React.ReactElement {
  const { theme, setTheme } = useTheme()
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
