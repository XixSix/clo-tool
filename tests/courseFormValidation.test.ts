import { describe, expect, it } from 'vitest'
import {
  isCourseFormValid,
  validateCourseForm
} from '../src/renderer/src/lib/course-form-validation'

const validForm = { maHp: 'KTLT101', courseName: 'Kỹ thuật lập trình', soTinChi: '3' }

describe('validateCourseForm', () => {
  it('form hợp lệ không có lỗi', () => {
    expect(validateCourseForm(validForm)).toEqual({})
    expect(isCourseFormValid(validForm)).toBe(true)
  })

  it('thiếu mã học phần', () => {
    const errors = validateCourseForm({ ...validForm, maHp: '   ' })
    expect(errors.maHp).toBeTruthy()
  })

  it('thiếu tên môn học', () => {
    const errors = validateCourseForm({ ...validForm, courseName: '' })
    expect(errors.courseName).toBeTruthy()
  })

  it.each(['', '0', '-1', '1.5', 'abc'])('số tín chỉ không hợp lệ: %s', (soTinChi) => {
    const errors = validateCourseForm({ ...validForm, soTinChi })
    expect(errors.soTinChi).toBeTruthy()
  })

  it('phát hiện mã trùng sau trim + uppercase', () => {
    const errors = validateCourseForm(
      { ...validForm, maHp: ' ktlt101 ' },
      ['KTLT101', 'THDC201']
    )
    expect(errors.maHp).toContain('KTLT101')
  })

  it('không báo trùng khi mã khác nhau', () => {
    const errors = validateCourseForm({ ...validForm, maHp: 'THDC201' }, ['KTLT101'])
    expect(errors.maHp).toBeUndefined()
  })
})
