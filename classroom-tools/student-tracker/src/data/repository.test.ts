import { beforeEach, expect, test, vi } from 'vitest'
import { DemoRepository, todayIso } from './repository'

beforeEach(() => {
  const values = new Map<string,string>()
  vi.stubGlobal('sessionStorage', {getItem:(key:string)=>values.get(key) ?? null, setItem:(key:string,value:string)=>values.set(key,value)})
})

test('new learning evidence belongs to a current session and survives repository reload', async () => {
  const repo = new DemoRepository()
  const before = await repo.load()
  const course = before.courses[2]
  const student = before.enrollments.find(item => item.course_id === course.id)!
  const sessionId = await repo.startSession(course.id)
  await repo.saveLearningEvent({course_id:course.id,session_id:sessionId,student_id:student.student_id,source:'voluntary_answer',textbook_id:'boya-quasi-intermediate-i',lesson_id:'lesson-02',lesson_label:'第 2 課',activity_label:'口語練習',task_completion:0,comprehensibility:null,language_control:2,interaction:1,needs_review:true})
  const restored = await new DemoRepository().load()
  expect(restored.sessions.find(item=>item.id===sessionId)?.session_date).toBe(todayIso())
  expect(restored.learningEvents[0]).toMatchObject({session_id:sessionId,source:'voluntary_answer',task_completion:0,comprehensibility:null,lesson_id:'lesson-02'})
  expect(before.courses.map(c=>before.enrollments.filter(e=>e.course_id===c.id).length)).toEqual([27,30,14])
})

test('a student from another class cannot receive a record', async () => {
  const repo = new DemoRepository()
  const snapshot = await repo.load()
  const sessionId = await repo.startSession(snapshot.courses[0].id)
  const other = snapshot.enrollments.find(e=>e.course_id===snapshot.courses[1].id)!
  await expect(repo.saveLearningEvent({course_id:snapshot.courses[0].id,session_id:sessionId,student_id:other.student_id,source:'random_call',lesson_label:'第 1 課',activity_label:'口語',task_completion:2,comprehensibility:2,language_control:2,interaction:2,needs_review:false})).rejects.toThrow('不屬於')
})
