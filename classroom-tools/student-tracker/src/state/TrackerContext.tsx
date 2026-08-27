import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DemoRepository, SupabaseRepository, type TrackerRepository } from '../data/repository'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { emptySnapshot, type AttendanceStatus, type ClassSession, type FollowupKind, type FollowupStatus, type ImportStudentRow, type ObservationResult, type TrackerSnapshot } from '../types'

type AccessState = 'checking' | 'signed_out' | 'ready'
type DataMode = 'demo' | 'supabase' | null

interface TrackerContextValue {
  access: AccessState
  mode: DataMode
  snapshot: TrackerSnapshot
  busy: boolean
  error: string | null
  configured: boolean
  enterDemo(): Promise<void>
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  clearError(): void
  startSession(courseId: string): Promise<string>
  saveAttendance(sessionId: string, studentId: string, status: AttendanceStatus): Promise<void>
  confirmRemainingPresent(sessionId: string, studentIds: string[]): Promise<void>
  saveObservation(sessionId: string, studentId: string, result: ObservationResult, note?: string): Promise<void>
  closeSession(sessionId: string, reflection: Pick<ClassSession, 'what_worked' | 'common_difficulty' | 'next_adjustment'>): Promise<void>
  setFollowupStatus(followupId: string, status: FollowupStatus): Promise<void>
  addFollowup(input: { courseId: string; studentId?: string; sessionId?: string; kind: FollowupKind; title: string; dueOn?: string }): Promise<void>
  importStudents(courseId: string, rows: ImportStudentRow[]): Promise<void>
  addCourse(input: { code: string; name: string; room?: string; scheduleText?: string }): Promise<void>
}

const TrackerContext = createContext<TrackerContextValue | null>(null)
const MODE_KEY = 'keji-access-mode'

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AccessState>('checking')
  const [mode, setMode] = useState<DataMode>(null)
  const [snapshot, setSnapshot] = useState<TrackerSnapshot>(emptySnapshot)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const repository = useRef<TrackerRepository | null>(null)

  const loadRepository = useCallback(async (nextRepository: TrackerRepository, nextMode: Exclude<DataMode, null>) => {
    repository.current = nextRepository
    setMode(nextMode)
    sessionStorage.setItem(MODE_KEY, nextMode)
    setSnapshot(await nextRepository.load())
    setAccess('ready')
  }, [])

  useEffect(() => {
    let active = true
    const initialize = async () => {
      if (sessionStorage.getItem(MODE_KEY) === 'demo') {
        await loadRepository(new DemoRepository(), 'demo')
        return
      }
      if (!supabase) {
        if (active) setAccess('signed_out')
        return
      }
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (!active) return
      if (sessionError) setError(sessionError.message)
      if (data.session) await loadRepository(new SupabaseRepository(supabase, data.session.user.id), 'supabase')
      else setAccess('signed_out')
    }
    void initialize()
    return () => { active = false }
  }, [loadRepository])

  const run = useCallback(async <T,>(action: (repo: TrackerRepository) => Promise<T>): Promise<T> => {
    if (!repository.current) throw new Error('資料尚未就緒。')
    setBusy(true)
    setError(null)
    try {
      const value = await action(repository.current)
      setSnapshot(await repository.current.load())
      return value
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '操作失敗，請再試一次。'
      setError(message)
      throw caught
    } finally {
      setBusy(false)
    }
  }, [])

  const value = useMemo<TrackerContextValue>(() => ({
    access, mode, snapshot, busy, error, configured: isSupabaseConfigured,
    enterDemo: async () => loadRepository(new DemoRepository(), 'demo'),
    signIn: async (email, password) => {
      if (!supabase) throw new Error('尚未設定線上資料庫。')
      setBusy(true)
      setError(null)
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        if (!data.user) throw new Error('登入失敗。')
        await loadRepository(new SupabaseRepository(supabase, data.user.id), 'supabase')
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '登入失敗。')
        throw caught
      } finally {
        setBusy(false)
      }
    },
    signOut: async () => {
      if (mode === 'supabase' && supabase) await supabase.auth.signOut()
      sessionStorage.removeItem(MODE_KEY)
      repository.current = null
      setSnapshot(emptySnapshot)
      setMode(null)
      setAccess('signed_out')
    },
    clearError: () => setError(null),
    startSession: (courseId) => run((repo) => repo.startSession(courseId)),
    saveAttendance: (sessionId, studentId, status) => run((repo) => repo.saveAttendance(sessionId, studentId, status)),
    confirmRemainingPresent: (sessionId, studentIds) => run((repo) => repo.confirmRemainingPresent(sessionId, studentIds)),
    saveObservation: (sessionId, studentId, result, note) => run((repo) => repo.saveObservation(sessionId, studentId, result, note)),
    closeSession: (sessionId, reflection) => run((repo) => repo.closeSession(sessionId, reflection)),
    setFollowupStatus: (followupId, status) => run((repo) => repo.setFollowupStatus(followupId, status)),
    addFollowup: (input) => run((repo) => repo.addFollowup(input)),
    importStudents: (courseId, rows) => run((repo) => repo.importStudents(courseId, rows)),
    addCourse: (input) => run((repo) => repo.addCourse(input)),
  }), [access, mode, snapshot, busy, error, loadRepository, run])

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>
}

export function useTracker() {
  const context = useContext(TrackerContext)
  if (!context) throw new Error('useTracker 必須在 TrackerProvider 內使用。')
  return context
}
