import React from 'react'
import { Check } from 'lucide-react'
import { cn } from 'cn'
import type { ImportStep } from '@renderer/hooks/use-import-pipeline'

export function StepBadge({
  number,
  done
}: {
  number: number
  done: boolean
}): React.ReactElement {
  return done ? (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
      <Check className="size-3.5" />
    </span>
  ) : (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
      {number}
    </span>
  )
}

/** Thanh tiến trình 3 bước ở đầu màn */
export function Stepper({
  steps,
  activeIndex
}: {
  steps: ImportStep[]
  activeIndex: number
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
      {steps.map((step, index) => (
        <React.Fragment key={step.title}>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                step.done
                  ? 'bg-success text-success-foreground'
                  : index === activeIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step.done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <div className="hidden min-w-0 sm:block">
              <p
                className={cn(
                  'truncate text-xs font-medium',
                  index === activeIndex ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{step.hint}</p>
            </div>
          </div>
          {index < steps.length - 1 ? (
            <span
              className={cn('h-px min-w-4 flex-1', step.done ? 'bg-foreground/30' : 'bg-border')}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  )
}
