import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTracker } from '../state/TrackerContext'

export function LoginPage() {
  const { signIn, enterDemo, busy, error, configured, clearError } = useTracker()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

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
        <div className="login-brand"><span className="brand-mark large">課</span><span>課跡</span></div>
        <div>
          <p className="eyebrow">你的課堂，不漏掉下一步</p>
          <h1>記得學生，也記得<br />下一堂要怎麼教。</h1>
          <p className="login-lead">點名、觀察、收尾放在同一個工作台。少寫一點，留下真正會用到的紀錄。</p>
        </div>
        <div className="login-proof" aria-hidden="true">
          <div><strong>10 秒</strong><span>開始課堂</span></div>
          <div><strong>2 次點擊</strong><span>留下觀察</span></div>
          <div><strong>2 分鐘</strong><span>完成收尾</span></div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <p className="eyebrow">教師登入</p>
          <h2>回到你的工作台</h2>
          <p className="muted">只有你的帳號能查看學生與課堂紀錄。</p>
          {configured ? (
            <form onSubmit={submit} className="form-stack">
              <label>電子郵件<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
              <label>密碼<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
              <button className="primary-button full" disabled={busy}>{busy ? '登入中…' : '登入'}</button>
            </form>
          ) : (
            <div className="setup-note"><strong>正式帳號尚未連接</strong><span>目前可先查看並操作完整範例。</span></div>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="text-button demo-entry" onClick={demo}>使用範例資料進入</button>
        </div>
        <p className="privacy-note">學生資料只用於你的教學紀錄，不提供公開註冊。</p>
      </section>
    </main>
  )
}
