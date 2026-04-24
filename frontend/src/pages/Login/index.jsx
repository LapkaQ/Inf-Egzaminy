import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth'
import { APP_NAME } from '../../config'

const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-white placeholder:text-faint outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] font-sans'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setUnverified(false)
    setResendMsg('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.message || 'Błąd logowania. Sprawdź dane i spróbuj ponownie.'
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('email')) {
        setUnverified(true)
        setError('Twój email nie został jeszcze potwierdzony. Sprawdź skrzynkę pocztową lub wyślij link ponownie.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await authService.resendVerification(email)
      setResendMsg('Email weryfikacyjny został wysłany ponownie!')
    } catch {
      setResendMsg('Nie udało się wysłać. Spróbuj później.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_40%,rgba(124,58,237,0.08)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] bg-surface border border-line rounded-2xl p-11 animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-sm font-black">
            {APP_NAME.charAt(0)}
          </div>
          <span className="font-extrabold text-white tracking-tight">
            {APP_NAME}
          </span>
        </div>

        <h1 className="text-[1.6rem] font-black tracking-[-0.04em] mb-1.5 text-white">
          Witaj ponownie
        </h1>
        <p className="text-sm text-subtle mb-8">
          Zaloguj się, żeby zarządzać lekcjami i postępami.
        </p>

        {error && (
          <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">
            {error}
            {unverified && (
              <div className="mt-3 pt-3 border-t border-red-500/15">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || !email}
                  className="text-accent text-xs font-semibold hover:text-violet-300 transition-colors cursor-pointer bg-transparent border-0 font-sans p-0"
                >
                  {resending ? 'Wysyłanie...' : 'Wyślij email weryfikacyjny ponownie'}
                </button>
                {resendMsg && (
                  <p className="mt-2 text-xs text-green-400">{resendMsg}</p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[0.82rem] font-medium text-subtle mb-2">
              Adres email
            </label>
            <input
              type="email"
              className={INPUT}
              placeholder="jan@kowalski.pl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[0.82rem] font-medium text-subtle">
                Hasło
              </label>
              <Link
                to="/forgot-password"
                className="text-[0.78rem] text-accent font-medium hover:text-violet-300 transition-colors"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            <input
              type="password"
              className={INPUT}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] cursor-pointer border-0 font-sans ${loading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {loading ? 'Logowanie...' : 'Zaloguj się →'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-6">
          Nie masz konta?{' '}
          <Link
            to="/register"
            className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
          >
            Zarejestruj się bezpłatnie
          </Link>
        </p>

        <div className="mt-8 p-4 bg-surface-2 rounded-xl border border-line text-center text-[0.75rem] text-faint">
          Twoje dane są szyfrowane i bezpieczne
        </div>
      </div>
    </div>
  )
}

export default Login
