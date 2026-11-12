import React from 'react'
import { Button } from '@renderer/components/ui/button'

export type GradeMode = 'single' | 'multi'

/** Công tắc chọn cách nhập điểm: một file duy nhất hay 2 giai đoạn. */
export function ModeSwitch({
  mode,
  onChange,
  disabled
}: {
  mode: GradeMode
  onChange: (mode: GradeMode) => void
  disabled?: boolean
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Cách nhập điểm</span>
      <div className="flex rounded-lg bg-muted p-0.5">
        <Button
          size="sm"
          variant={mode === 'multi' ? 'default' : 'ghost'}
          disabled={disabled}
          onClick={() => onChange('multi')}
        >
          Hai giai đoạn
        </Button>
        <Button
          size="sm"
          variant={mode === 'single' ? 'default' : 'ghost'}
          disabled={disabled}
          onClick={() => onChange('single')}
        >
          Một file
        </Button>
      </div>
    </div>
  )
}
