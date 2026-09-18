import type { Course } from '../types'

const courseCodeOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

/** Course codes define teaching order; equal codes retain their incoming order. */
export function orderCourses(courses: readonly Course[]): Course[] {
  return [...courses].sort((a, b) => {
    const left = a.code.trim()
    const right = b.code.trim()
    if (!left || !right) return left ? -1 : right ? 1 : 0
    return courseCodeOrder.compare(left, right)
  })
}
