import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Field, FieldLabel } from '@renderer/components/ui/field'
import type { SemesterOption } from '@renderer/lib/semester'

const OPTIONS = ['Học kì 1', 'Học kì 2', 'Khác'] as const

/** Chọn nhanh học kỳ; chọn "Khác" thì hiện ô nhập tự do. */
export function SemesterPicker({
  option,
  value,
  onOptionChange,
  onValueChange
}: {
  option: SemesterOption
  value: string
  onOptionChange: (option: SemesterOption) => void
  onValueChange: (value: string) => void
}): React.ReactElement {
  function select(next: (typeof OPTIONS)[number]): void {
    if (option === next) {
      onOptionChange('')
      onValueChange('')
      return
    }
    onOptionChange(next)
    if (next === 'Học kì 1' || next === 'Học kì 2') {
      onValueChange(next)
    } else {
      onValueChange(value === 'Học kì 1' || value === 'Học kì 2' ? '' : value)
    }
  }

  return (
    <Field>
      <FieldLabel>Học kỳ</FieldLabel>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((opt) => (
            <Button
              key={opt}
              type="button"
              size="sm"
              variant={option === opt ? 'default' : 'outline'}
              className="w-full text-xs"
              onClick={() => select(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
        {option === 'Khác' ? (
          <Input
            id="hoc-ky-khac"
            placeholder="Nhập học kỳ (VD: Học kì hè, HK3…)"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            autoFocus
          />
        ) : null}
      </div>
    </Field>
  )
}
