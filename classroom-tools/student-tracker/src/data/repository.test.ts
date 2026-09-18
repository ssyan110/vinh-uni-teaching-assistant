import { beforeEach, expect, test, vi } from 'vitest'
import { DemoRepository, SupabaseRepository, todayIso, validateClassroomRecordCorrection, validateSessionEdit } from './repository'
import { createDemoSnapshot } from './demoData'
import type { RandomizerAttempt } from '../types'

beforeEach(() => {
  const values = new Map<string,string>()
  vi.stubGlobal('sessionStorage', {getItem:(key:string)=>values.get(key) ?? null, setItem:(key:string,value:string)=>values.set(key,value)})
})

test('volunteer save retry uses the same event identity without adding a second answer', async () => {
  const repo = new DemoRepository()
  const before = await repo.load()
  const course = before.courses[0]
  const student = before.enrollments.find(e => e.course_id === course.id)!
  const sessionId = await repo.startSession(course.id)
  const input = { course_id: course.id, session_id: sessionId, student_id: student.student_id,
    client_event_id: 'volunteer:synthetic-retry', source: 'voluntary_answer' as const,
    textbook_id: 'boya-quasi-intermediate-i', lesson_id: 'lesson-01', lesson_label: 'lesson-01', activity_label: '自願發言',
    task_completion: null, comprehensibility: null, language_control: null, interaction: null, needs_review: false, counted_for_grade: false }
  await repo.saveLearningEvent(input)
  await repo.saveLearningEvent(input)
  const after = await new DemoRepository().load()
  expect(after.learningEvents.filter(e => e.client_event_id === input.client_event_id)).toHaveLength(1)
  const upsert = vi.fn().mockResolvedValue({error: null})
  const from = vi.fn().mockReturnValue({upsert})
  const cloud = new SupabaseRepository({from} as never, 'synthetic-owner')
  await cloud.saveLearningEvent(input)
  expect(upsert).toHaveBeenCalledWith(expect.objectContaining({client_event_id: input.client_event_id, counted_for_grade:false}),
    {onConflict:'owner_id,client_event_id',ignoreDuplicates:true})
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

test('after-class status and progress are saved with the session', async () => {
  const repo = new DemoRepository()
  const snapshot = await repo.load()
  const sessionId = await repo.startSession(snapshot.courses[0].id)
  await repo.closeSession(sessionId, {
    class_status: '整體順利，學生有投入活動。',
    progress_text: '完成教材 P12–13，做到口語練習 2。',
    what_worked: null,
    common_difficulty: null,
    next_adjustment: null,
  })

  const restored = await new DemoRepository().load()
  expect(restored.sessions.find((session) => session.id === sessionId)).toMatchObject({
    status: 'completed',
    class_status: '整體順利，學生有投入活動。',
    progress_text: '完成教材 P12–13，做到口語練習 2。',
  })
})

test('after-class text is bounded before it reaches storage', async () => {
  const repo = new DemoRepository()
  const snapshot = await repo.load()
  const sessionId = await repo.startSession(snapshot.courses[0].id)
  await expect(repo.closeSession(sessionId, {
    class_status: 'x'.repeat(2001),
    progress_text: null,
    what_worked: null,
    common_difficulty: null,
    next_adjustment: null,
  })).rejects.toThrow('2000')
})

test('teacher can edit a classroom session date and ordinal without changing answer events', async () => {
  const repo = new DemoRepository()
  const before = await repo.load()
  const sessionId = await repo.startSession(before.courses[0].id)
  const beforeAnswers = before.learningEvents.length
  await repo.updateSession(sessionId, { sessionDate: '2026-09-09', sessionNumber: 1, reason: '修正測試場次日期與次數' })
  const after = await repo.load()
  expect(after.sessions.find((session) => session.id === sessionId)).toMatchObject({ session_date: '2026-09-09', session_number: 1 })
  expect(after.learningEvents).toHaveLength(beforeAnswers)
})

test('session edit rejects invalid dates and ordinals', () => {
  expect(() => validateSessionEdit({ sessionDate: '2026-02-30', sessionNumber: 1, reason: '修正' })).toThrow('有效')
  expect(() => validateSessionEdit({ sessionDate: '2026-09-09', sessionNumber: 0, reason: '修正' })).toThrow('1 到 999')
  expect(() => validateSessionEdit({ sessionDate: '2026-09-09', sessionNumber: 1, reason: '' })).toThrow('修正原因')
})

test('demo correction keeps a learning event, excludes it from counts and appends an audit', async () => {
  const repo = new DemoRepository()
  const before = await repo.load()
  const course = before.courses[0]
  const student = before.enrollments.find(item => item.course_id === course.id)!
  const sessionId = before.sessions.find(item => item.course_id === course.id)!.id
  await repo.saveLearningEvent({ course_id: course.id, session_id: sessionId, student_id: student.student_id, source: 'voluntary_answer', textbook_id: 'boya-quasi-intermediate-i', lesson_id: 'lesson-01', lesson_label: '第 1 課', activity_label: '自願發言', task_completion: null, comprehensibility: null, language_control: null, interaction: null, needs_review: false })
  const created = (await repo.load()).learningEvents[0]
  await repo.correctClassroomRecord({ recordType: 'learning_event', recordId: created.id, reason: '學生缺席，誤按記錄回答。' })
  const restored = await new DemoRepository().load()
  expect(restored.learningEvents).toHaveLength(before.learningEvents.length + 1)
  expect(restored.learningEvents.find(item => item.id === created.id)).toMatchObject({ record_status: 'corrected', counted_for_summary: false, correction_note: '學生缺席，誤按記錄回答。' })
  expect(restored.correctionAudits).toHaveLength(1)
  expect(restored.correctionAudits?.[0]).toMatchObject({ record_type: 'learning_event', record_id: created.id, course_id: course.id, student_id: student.student_id, previous_record_status: 'valid', next_record_status: 'corrected', reason: '學生缺席，誤按記錄回答。' })
  await expect(repo.correctClassroomRecord({ recordType: 'learning_event', recordId: created.id, reason: '再次修正' })).rejects.toThrow('已更正')
})

test('demo correction also handles a randomizer attempt without deleting it', async () => {
  const snapshot = createDemoSnapshot()
  const course = snapshot.courses[0]
  const session = snapshot.sessions.find(item => item.course_id === course.id)!
  const student = snapshot.enrollments.find(item => item.course_id === course.id)!
  snapshot.attempts = [{ id: 'attempt-to-correct', owner_id: 'demo-owner', client_attempt_id: 'client-attempt-to-correct', randomizer_session_id: 'randomizer-session', randomizer_sessions: { class_session_id: session.id }, course_id: course.id, student_id: student.student_id, student_code: student.student_id, student_name: '測試學生', selection_method: 'random', outcome: 'answered', assessment_status: 'pending', performance_level: null, observation_version: null, task_prompt: null, question_id: null, textbook_id: 'boya-quasi-intermediate-i', lesson_id: 'lesson-01', task_target: '回答', task_mode: '口語', rubric_id: 'response', rubric_version: '1.0', task_completion: null, comprehensibility: null, language_control_vocabulary: null, content_interaction: null, total_score: null, record_status: 'valid', counted_for_summary: true, drawn_at: '2026-09-08T01:00:00Z', completed_at: '2026-09-08T01:01:00Z', note: null, correction_note: null, corrected_at: null } as RandomizerAttempt]
  sessionStorage.setItem('keji-demo-snapshot-v1', JSON.stringify(snapshot))
  const repo = new DemoRepository()
  await repo.correctClassroomRecord({ recordType: 'randomizer_attempt', recordId: 'attempt-to-correct', reason: '缺席，誤按回答。' })
  const restored = await repo.load()
  expect(restored.attempts[0]).toMatchObject({ record_status: 'corrected', counted_for_summary: false, correction_note: '缺席，誤按回答。' })
  expect(restored.correctionAudits?.[0]).toMatchObject({ record_type: 'randomizer_attempt', record_id: 'attempt-to-correct' })
})

test('record correction validation requires a supported record and reason', () => {
  expect(() => validateClassroomRecordCorrection({ recordType: 'unknown' as never, recordId: 'id', reason: '修正' })).toThrow('類型')
  expect(() => validateClassroomRecordCorrection({ recordType: 'learning_event', recordId: '', reason: '修正' })).toThrow('找不到')
  expect(() => validateClassroomRecordCorrection({ recordType: 'learning_event', recordId: 'id', reason: '' })).toThrow('修正原因')
})

test('cloud snapshot reads beyond the first thousand raw attempts',async()=>{
 const offsets:number[]=[]
 const client={from:(table:string)=>{
   const query={select:()=>query,eq:()=>query,order:()=>query,range:async(start:number)=>{
     if(table==='randomizer_attempts') {offsets.push(start);return {data:Array.from({length:start===0?1000:2},(_,i)=>({id:String(start+i)})),error:null}}
     if(table==='learning_events') return {data:[{id:'event-absent',no_response_reason:'absent'}],error:null}
     if(table==='classroom_record_corrections') return {data:[{id:'correction-1',record_type:'learning_event',record_id:'event-1',reason:'測試修正'}],error:null}
     return {data:[],error:null}
   }}
   return query
 }}
 const snapshot=await new SupabaseRepository(client as never,'owner').load()
 expect(snapshot.attempts).toHaveLength(1002);expect(offsets).toEqual([0,1000]);expect(snapshot.learningEvents[0]).toMatchObject({id:'event-absent',no_response_reason:'absent'});expect(snapshot.correctionAudits).toHaveLength(1)
})

test('cloud correction delegates to the owner-scoped correction RPC', async () => {
  const calls: { name: string; args: unknown }[] = []
  const client = { rpc: async (name: string, args: unknown) => { calls.push({ name, args }); return { data: null, error: null } } }
  const repo = new SupabaseRepository(client as never, 'owner')
  await repo.correctClassroomRecord({ recordType: 'randomizer_attempt', recordId: 'attempt-1', reason: '缺席，誤按回答。' })
  expect(calls).toEqual([{ name: 'correct_classroom_record', args: { p_record_type: 'randomizer_attempt', p_record_id: 'attempt-1', p_reason: '缺席，誤按回答。' } }])
})
