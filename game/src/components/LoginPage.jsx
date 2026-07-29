import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value)

  const handleAuth = async (e) => {
    e.preventDefault()
    if (submitting) return

    setErrorMessage('')
    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Введите корректный адрес электронной почты.')
      return
    }

    setSubmitting(true)
    try {
      setSuccessMessage('')
      if (isLogin) {
        const { error } = await signIn(normalizedEmail, password)
        if (error) {
          const emailNotConfirmed = error.code === 'email_not_confirmed'
            || error.message?.toLowerCase().includes('email not confirmed')
          setErrorMessage(emailNotConfirmed
            ? 'Почта ещё не подтверждена. Откройте письмо от Supabase и перейдите по ссылке.'
            : error.message)
        }
      } else {
        const { error } = await signUp(normalizedEmail, password)
        if (!error) {
          setConfirmationEmail(normalizedEmail)
          setSuccessMessage('')
        } else {
          const rateLimited = error.status === 429
            || error.code === 'over_email_send_rate_limit'
            || error.message?.toLowerCase().includes('rate limit')
          setErrorMessage(rateLimited
            ? 'Слишком много писем отправлено за короткое время. Подождите некоторое время (иногда до часа) и попробуйте снова.'
            : error.message)
          console.error('Signup error:', error.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleForm = () => {
    setIsLogin(!isLogin)
    setSuccessMessage('')
    setErrorMessage('')
  }

  return (
    <div className="login-page">
      <section className="login-form-side">
        <div className="brand login-brand">
          <span className="brand-mark">か</span>
          <span>Кёги Карута<small className="brand-kana">競技かるた</small></span>
        </div>
        <span className="eyebrow">{isLogin ? 'С возвращением' : 'Первый шаг на татами'}</span>
        <h1>{isLogin ? 'Войти в зал каруты' : 'Создать игрока'}</h1>
        <p className="login-subtitle">Слушайте стихи, собирайте карты и растите вместе с командой.</p>
        <form className="login-form" onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Электронная почта"
            aria-label="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            aria-label="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="primary-button login-submit" type="submit" disabled={submitting}>
            {submitting
              ? (isLogin ? 'Входим…' : 'Отправляем письмо…')
              : (isLogin ? 'Войти на татами' : 'Создать аккаунт')}
          </button>
        </form>
        {successMessage && <p className="login-message success">{successMessage}</p>}
        {errorMessage && <p className="login-message error" role="alert">{errorMessage}</p>}
        <button className="login-toggle" onClick={handleToggleForm}>
          {isLogin ? 'Нет аккаунта? Присоединиться' : 'Уже играете? Войти'}
        </button>
      </section>
      <aside className="login-art">
        <div className="login-art-caption">百人一首 · Сто поэтов, одна весна 🌸</div>
      </aside>

      {confirmationEmail && (
        <div className="email-confirm-backdrop" onClick={() => setConfirmationEmail('')}>
          <section className="email-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="email-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className="email-confirm-icon">
              <span>✉</span>
              <i>🌸</i>
            </div>
            <span className="eyebrow">Остался один шаг</span>
            <h2 id="email-confirm-title">Подтвердите почту</h2>
            <p>Мы отправили письмо на</p>
            <strong>{confirmationEmail}</strong>
            <p className="email-confirm-note">
              Перейдите по ссылке из письма, а затем вернитесь сюда и войдите в аккаунт.
              Проверьте папку «Спам», если письмо не появилось.
            </p>
            <button className="primary-button" onClick={() => setConfirmationEmail('')}>Хорошо, проверю почту</button>
          </section>
        </div>
      )}
    </div>
  )
}
