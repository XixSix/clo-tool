import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import { useCourseForm } from '@renderer/hooks/use-course-form'
import type { SessionDto } from '../../../../../shared/ipc'
import { SemesterPicker } from '@renderer/components/screens/courses/semester-picker'

export function AddCourseDialog({
  open,
  onOpenChange,
  onSubmit
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (s: SessionDto) => void
}): React.ReactElement {
  const {
    form,
    setForm,
    config,
    hocKyOption,
    setHocKyOption,
    busy,
    error,
    bridgeReady,
    field,
    pickConfig,
    makeSession,
    reset
  } = useCourseForm()

  function submit(): void {
    const session = makeSession()
    if (!session) return
    onSubmit(session)
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm môn học</DialogTitle>
          <DialogDescription>
            Điền thủ công hoặc chọn file Config để tự điền thông tin.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ma-hp">Mã học phần *</FieldLabel>
            <Input id="ma-hp" placeholder="VD: KTLT101" className="font-mono" {...field('maHp')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="course-name">Tên môn học *</FieldLabel>
            <Input
              id="course-name"
              placeholder="VD: Kỹ thuật lập trình"
              {...field('courseName')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="so-tin-chi">Số tín chỉ</FieldLabel>
              <Input id="so-tin-chi" type="number" min="1" step="1" {...field('soTinChi')} />
            </Field>
            <Field>
              <FieldLabel htmlFor="lop">Lớp</FieldLabel>
              <Input id="lop" placeholder="VD: D21-1" {...field('lop')} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="nam-hoc">Năm học</FieldLabel>
            <Input id="nam-hoc" placeholder="VD: 2025-2026" {...field('namHoc')} />
          </Field>
          <SemesterPicker
            option={hocKyOption}
            value={form.hocKy}
            onOptionChange={setHocKyOption}
            onValueChange={(hocKy) => setForm((f) => ({ ...f, hocKy }))}
          />
          <Field>
            <FieldLabel>File Config</FieldLabel>
            <Button type="button" variant="outline" onClick={pickConfig} disabled={busy || !bridgeReady}>
              {form.configPath ? 'Chọn file khác…' : 'Chọn file Template_Config.xlsx…'}
            </Button>
            <FieldDescription>
              {busy
                ? 'Đang đọc file…'
                : form.configPath || 'Tùy chọn — chỉ dùng đọc trước thông tin môn'}
            </FieldDescription>
          </Field>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {config?.ok ? (
            <p className="text-xs text-success">
              Đã đọc: {config.cloList.length} CLO · {config.planCount} đầu điểm
            </p>
          ) : null}
        </FieldGroup>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!form.maHp.trim() || !form.courseName.trim()}>
            Thêm môn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
