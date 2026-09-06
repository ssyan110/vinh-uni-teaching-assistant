import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'

export function LoginPage() {
  const { signIn, enterDemo, busy, error, configured, configurationIssue, access, clearError } = useTracker()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const checking = access === 'checking'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await signIn(email, password)
      navigate('/today')
    } catch { /* error is shown by the provider */ }
  }

  const demo = async () => {
    clearError()
    await enterDemo()
    navigate('/today')
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand"><img className="brand-logo large" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" /><span>荣市大学</span></div>
        <div>
          <p className="eyebrow">教师端</p>
          <h1>荣市大学<br />学生管理系统</h1>
          <p className="login-lead">用于管理课程、学生、出席和课堂记录。</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">教师登录</p>
          <h2>教师登录</h2>
          <p className="muted">登录后管理课程和学生记录。</p>
          {!configured && configurationIssue
            ? <p className="login-status unavailable" role="status">{configurationIssue}</p>
            : checking && <p className="login-status checking" role="status">正在检查登录状态，请稍候。</p>}
          <form onSubmit={submit} className="form-stack" aria-busy={busy || checking}>
            <label htmlFor="teacher-email">电子邮件<input id="teacher-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label htmlFor="teacher-password">密码<input id="teacher-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="primary-button full" disabled={busy || checking || !configured}>{busy ? '登录中…' : checking ? '检查中…' : '登录'}</button>
          </form>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="text-button demo-entry" onClick={demo} disabled={busy || checking}>使用示例数据查看界面</button>
        </div>
        <p className="privacy-note">学生资料仅用于你的教学记录，不提供公开注册。</p>
      </section>
    </main>
  )
}
