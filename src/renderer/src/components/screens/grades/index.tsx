import React from 'react'
import { BookOpen, TriangleAlert } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { Button } from '@renderer/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { hasBridge } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useImportPipeline } from '@renderer/hooks/use-import-pipeline'
import type { ScreenId } from '@renderer/lib/navigation'
import { Stepper } from '@renderer/components/screens/grades/stepper'
import { StepConfigCard } from '@renderer/components/screens/grades/step-config-card'
import { StepRawCard } from '@renderer/components/screens/grades/step-raw-card'
import { StepRunCard } from '@renderer/components/screens/grades/step-run-card'

export function NhapDiem({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const bridgeReady = hasBridge()
  const {
    configPath,
    config,
    rawPath,
    raw,
    outDir,
    result,
    busy,
    error,
    canRun,
    missing,
    steps,
    activeIndex,
    pickConfig,
    pickRaw,
    pickOutput,
    run,
    reset
  } = useImportPipeline(active, bridgeReady)

  if (!active) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <BookOpen className="text-muted-foreground/40" />
          <EmptyTitle>Chưa chọn môn học</EmptyTitle>
          <EmptyDescription>
            Thêm hoặc chọn một môn học trước khi nhập file Config và file điểm thô.
          </EmptyDescription>
        </EmptyHeader>
        <Button onClick={() => onScreen('courses')}>Thêm môn học</Button>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
        <p className="min-w-0 text-[13px]">
          <span className="font-mono font-semibold">{active.maHp}</span>
          <span className="text-muted-foreground">
            {active.lop ? ` · lớp ${active.lop} · ` : ' · '}
            {active.courseName}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="shrink-0">
            Môn hiện tại
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={Boolean(busy) || (!configPath && !rawPath && !result)}
          >
            Đặt lại
          </Button>
        </div>
      </div>

      <Stepper steps={steps} activeIndex={activeIndex} />

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Đã có lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StepConfigCard
          configPath={configPath}
          config={config}
          busy={busy}
          bridgeReady={bridgeReady}
          onPick={pickConfig}
        />
        <StepRawCard
          rawPath={rawPath}
          raw={raw}
          configPath={configPath}
          busy={busy}
          bridgeReady={bridgeReady}
          onPick={pickRaw}
        />
      </div>

      <StepRunCard
        configPath={configPath}
        rawPath={rawPath}
        outDir={outDir}
        result={result}
        busy={busy}
        canRun={canRun}
        missing={missing}
        onPickOutput={pickOutput}
        onRun={run}
        onScreen={onScreen}
      />
    </div>
  )
}
