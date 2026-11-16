/** Validate cơ bản của hộp thoại "Thêm môn học" — thuần TS để test được ngoài React. */

export interface CourseFormValues {
  maHp: string
  courseName: string
  soTinChi: string
}

export interface CourseFormErrors {
  maHp?: string
  courseName?: string
  soTinChi?: string
}

export type CourseFormField = keyof CourseFormErrors

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export function validateCourseForm(
  form: CourseFormValues,
  existingCodes: string[] = []
): CourseFormErrors {
  const errors: CourseFormErrors = {}

  const code = normalizeCode(form.maHp)
  if (!code) {
    errors.maHp = 'Vui lòng nhập mã học phần.'
  } else if (existingCodes.some((existing) => normalizeCode(existing) === code)) {
    errors.maHp = `Mã học phần "${code}" đã tồn tại trong danh sách.`
  }

  if (!form.courseName.trim()) {
    errors.courseName = 'Vui lòng nhập tên môn học.'
  }

  const credits = form.soTinChi.trim()
  const value = Number(credits)
  if (!credits || !Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    errors.soTinChi = 'Số tín chỉ phải là số nguyên lớn hơn 0.'
  }

  return errors
}

export function isCourseFormValid(form: CourseFormValues, existingCodes: string[] = []): boolean {
  return Object.keys(validateCourseForm(form, existingCodes)).length === 0
}
