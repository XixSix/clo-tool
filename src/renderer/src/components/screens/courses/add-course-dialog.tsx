import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import { useCourseForm } from '@renderer/hooks/use-course-form'
import type { SessionDto } from '../../../../../shared/ipc'
import { SemesterPicker } from '@renderer/components/screens/courses/semester-picker'
import {
  validateCourseForm,
  type CourseFormField
} from '@renderer/lib/course-form-validation'

const FIELD_IDS: Record<CourseFormField, string> = {
  maHp: 'ma-hp',
  courseName: 'course-name',
  soTinChi: 'so-tin-chi'
}

const FIELD_ORDER: CourseFormField[] = ['maHp', 'courseName', 'soTinChi']

export function AddCourseDialog({
  open,
  onOpenChange,
  onSubmit,
  existingCodes = []
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSubmit: (s: SessionDto) => void
  existingCodes?: string[]
}): React.ReactElement {
  const { form, setForm, hocKyOption, setHocKyOption, touched, field, makeSession, reset } =
    useCourseForm()
  const [submitted, setSubmitted] = useState(false)

  const errors = validateCourseForm(form, existingCodes)
  const valid = Object.keys(errors).length === 0

  const visibleError = (key: CourseFormField): string | undefined =>
    submitted || touched[key] ? errors[key] : undefined

  function handleOpenChange(next: boolean): void {
    if (!next) {
      reset()
      setSubmitted(false)
    }
    onOpenChange(next)
  }

  function submit(): void {
    setSubmitted(true)
    const firstError = FIELD_ORDER.find((key) => errors[key])
    if (firstError) {
      document.getElementById(FIELD_IDS[firstError])?.focus()
      return
    }
    const session = makeSession()
    if (!session) return
    onSubmit(session)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm môn học</DialogTitle>
          <DialogDescription>
            Điền thông tin cơ bản; cấu hình CLO/PLO nhập trong trang chi tiết môn sau khi thêm.
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <FieldGroup>
            <Field data-invalid={!!visibleError('maHp') || undefined}>
              <FieldLabel htmlFor={FIELD_IDS.maHp}>Mã học phần *</FieldLabel>
              <Input
                id={FIELD_IDS.maHp}
                placeholder="VD: KTLT101"
                className="font-mono"
                aria-invalid={!!visibleError('maHp') || undefined}
                {...field('maHp')}
              />
              <FieldError
                errors={[visibleError('maHp') ? { message: visibleError('maHp') } : undefined]}
              />
            </Field>
            <Field data-invalid={!!visibleError('courseName') || undefined}>
              <FieldLabel htmlFor={FIELD_IDS.courseName}>Tên môn học *</FieldLabel>
              <Input
                id={FIELD_IDS.courseName}
                placeholder="VD: Kỹ thuật lập trình"
                aria-invalid={!!visibleError('courseName') || undefined}
                {...field('courseName')}
              />
              <FieldError
                errors={[
                  visibleError('courseName') ? { message: visibleError('courseName') } : undefined
                ]}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!visibleError('soTinChi') || undefined}>
                <FieldLabel htmlFor={FIELD_IDS.soTinChi}>Số tín chỉ</FieldLabel>
                <Input
                  id={FIELD_IDS.soTinChi}
                  type="number"
                  min="1"
                  step="1"
                  aria-invalid={!!visibleError('soTinChi') || undefined}
                  {...field('soTinChi')}
                />
                <FieldError
                  errors={[
                    visibleError('soTinChi') ? { message: visibleError('soTinChi') } : undefined
                  ]}
                />
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
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={!valid}>
              Thêm môn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
