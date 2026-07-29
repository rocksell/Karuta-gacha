import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    if (isLogin) {
      setSuccessMessage('')
      const { error } = await signIn(email, password)
      if (error) {
        setErrorMessage(error.message)
      }
    } else {
      setSuccessMessage('')
      const { error } = await signUp(email, password)
      if (!error) {
        setSuccessMessage('Account created successfully! Please check your email to confirm.')
      } else {
        setErrorMessage(error.message)
        console.error('Signup error:', error.message)
      }
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
            required
          />
          <button className="primary-button login-submit" type="submit">
            {isLogin ? 'Войти на татами' : 'Создать аккаунт'}
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
    </div>
  )
}
