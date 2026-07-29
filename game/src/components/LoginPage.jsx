import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isLogin) {
      setSuccessMessage('') // Clear message when switching to login
      await signIn(email, password)
    } else {
      setSuccessMessage('') // Clear message when switching to sign up
      const { error } = await signUp(email, password)
      if (!error) {
        setSuccessMessage('Account created successfully! Please check your email to confirm.')
      } else {
        // Handle signup error if needed, e.g., set an errorMessage state
        console.error('Signup error:', error.message)
      }
    }
  }

  const handleToggleForm = () => {
    setIsLogin(!isLogin)
    setSuccessMessage('') // Clear message when toggling form
  }

  return (
    <div>
      <h1>Enter the Karuta Hall</h1>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isLogin ? 'Login' : 'Create Account'}</button>
      </form>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      <button onClick={handleToggleForm}>
        {isLogin ? 'Need an account? Sign up' : 'Have an account? Log in'}
      </button>
    </div>
  )
}
