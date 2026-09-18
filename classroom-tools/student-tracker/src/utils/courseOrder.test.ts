import { expect, test } from 'vitest'
import type { Course } from '../types'
import { orderCourses } from './courseOrder'

test('course codes naturally order current and future classes without mutating the source', () => {
  const codes = ['LT_10', 'LT_03', 'LT_02', 'LT_01', 'LT_9', 'LT_100']
  const courses = codes.map((code, i) => ({ id: String(i), code, name: String(10-i) })) as Course[]
  expect(orderCourses(courses).map(c => c.code)).toEqual(['LT_01','LT_02','LT_03','LT_9','LT_10','LT_100'])
  expect(courses.map(c => c.code)).toEqual(codes)
})

test('equal numeric codes keep stable source order; blank codes follow known codes', () => {
  const courses = [{id:'blank',code:' '},{id:'first',code:'LT_02'},{id:'second',code:'lt_2'},{id:'last',code:''}] as Course[]
  expect(orderCourses(courses).map(c=>c.id)).toEqual(['first','second','blank','last'])
})
