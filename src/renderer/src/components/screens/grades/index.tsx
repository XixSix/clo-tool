import React, { useState } from 'react'
import { BookOpen, TriangleAlert } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@renderer/components/ui/alert'
import { Button } from '@renderer/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@renderer/components/ui/empty'
import { hasBridge } from '@renderer/lib/theme'
import { useWorkspace } from '@renderer/hooks/workspace'
import { useImportPipeline } from '@renderer/hooks/use-import-pipeline'
import { useMultiphasePipeline } from '@renderer/hooks/use-multiphase-pipeline'
import type { ScreenId } from '@renderer/lib/navigation'
import { Stepper } from '@renderer/components/screens/grades/stepper'
import { StepConfigCard } from '@renderer/components/screens/grades/step-config-card'
import { StepRawCard } from '@renderer/components/screens/grades/step-raw-card'
import { StepRunCard } from '@renderer/components/screens/grades/step-run-card'
import { ModeSwitch, type GradeMode } from '@renderer/components/screens/grades/multiphase/mode-switch'
import { StepProcessCard } from '@renderer/components/screens/grades/multiphase/step-process-card'
import { StepFinalCard } from '@renderer/components/screens/grades/multiphase/step-final-card'
import { StepResultCard } from '@renderer/components/screens/grades/multiphase/step-result-card'

export function NhapDiem({ onScreen }: { onScreen: (s: ScreenId) => void }): React.ReactElement {
  const { active } = useWorkspace()
  const bridgeReady = hasBridge()
  const [mode, setMode] = useState<GradeMode>('multi')
  const single = useImportPipeline(active, bridgeReady)
  const multi = useMultiphasePipeline(active, bridgeReady)

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

  const flow = mode === 'multi' ? multi : single
  const canReset =
    flow.busy === null &&
    (mode === 'multi'
      ? Boolean(multi.configPath || multi.processRawPath || multi.finalRawPath || multi.result)
      : Boolean(single.configPath || single.rawPath || single.result))

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
        <div className="flex items-center gap-3">
          <ModeSwitch mode={mode} onChange={setMode} disabled={Boolean(flow.busy)} />
          <Badge variant="secondary" className="shrink-0">
            Môn hiện tại
          </Badge>
          <Button variant="ghost" size="sm" onClick={flow.reset} disabled={!canReset}>
            Đặt lại
          </Button>
        </div>
      </div>

      <Stepper steps={flow.steps} activeIndex={flow.activeIndex} />

      {flow.error ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Đã có lỗi</AlertTitle>
          <AlertDescription>{flow.error}</AlertDescription>
        </Alert>
      ) : null}

      {mode === 'multi' ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StepConfigCard
              configPath={multi.configPath}
              config={multi.config}
              busy={multi.busy}
              bridgeReady={bridgeReady}
              onPick={multi.pickConfig}
            />
            <StepProcessCard
              processRawPath={multi.processRawPath}
              processRaw={multi.processRaw}
              processResult={multi.processResult}
              processRunId={multi.processRunId}
              processReportPath={multi.processReportPath}
              outDir={multi.outDir}
              studentCount={
                multi.processResult?.studentCount ?? multi.processSnapshot?.studentCount ?? 0
              }
              configPath={multi.configPath}
              busy={multi.busy}
              canRun={multi.canRunProcess}
              missing={multi.missingProcess}
              bridgeReady={bridgeReady}
              onPick={multi.pickProcessRaw}
              onPickOutput={multi.pickOutput}
              onRun={multi.runProcess}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StepFinalCard
              finalRawPath={multi.finalRawPath}
              finalRaw={multi.finalRaw}
              processReady={Boolean(multi.processRunId)}
              configPath={multi.configPath}
              busy={multi.busy}
              canRun={multi.canRunFinal}
              missing={multi.missingFinal}
              bridgeReady={bridgeReady}
              onPick={multi.pickFinalRaw}
              onRun={multi.runFinal}
            />
            <StepResultCard result={multi.result} onScreen={onScreen} />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StepConfigCard
              configPath={single.configPath}
              config={single.config}
              busy={single.busy}
              bridgeReady={bridgeReady}
              onPick={single.pickConfig}
            />
            <StepRawCard
              rawPath={single.rawPath}
              raw={single.raw}
              configPath={single.configPath}
              busy={single.busy}
              bridgeReady={bridgeReady}
              onPick={single.pickRaw}
            />
          </div>

          <StepRunCard
            configPath={single.configPath}
            rawPath={single.rawPath}
            outDir={single.outDir}
            result={single.result}
            busy={single.busy}
            canRun={single.canRun}
            missing={single.missing}
            onPickOutput={single.pickOutput}
            onRun={single.run}
            onScreen={onScreen}
          />
        </>
      )}
    </div>
  )
}
