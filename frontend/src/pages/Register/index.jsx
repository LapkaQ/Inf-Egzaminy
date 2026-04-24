import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../../services/auth'
import { useAuth } from '../../context/AuthContext'
import { APP_NAME } from '../../config'

const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-white placeholder:text-faint outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] font-sans'
const SELECT = `${INPUT} cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='%237a7a96'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M7%2010l5%205%205-5z'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_1rem_center]`

export const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }
    setLoading(true)
    try {
      await authService.register(email, password, name, role)
      setRegistered(true)
    } catch (err) {
      setError(err.message || 'Błąd rejestracji. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await authService.resendVerification(email)
      setResendMsg('Email weryfikacyjny został wysłany ponownie!')
    } catch {
      setResendMsg('Nie udało się wysłać ponownie. Spróbuj później.')
    } finally {
      setResending(false)
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_40%,rgba(124,58,237,0.08)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[460px] bg-surface border border-line rounded-2xl p-11 text-center animate-scale-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-sm font-black">
              {APP_NAME.charAt(0)}
            </div>
            <span className="font-extrabold text-white tracking-tight">
              {APP_NAME}
            </span>
          </div>

          <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto text-4xl mb-6 animate-scale-in [animation-delay:0.1s]">

          </div>

          <h1 className="text-[1.5rem] font-black tracking-[-0.04em] mb-3 text-white">
            Potwierdź swój email
          </h1>
          <p className="text-sm text-subtle mb-6 leading-relaxed">
            Wysłaliśmy link weryfikacyjny na adres{' '}
            <strong className="text-white">{email}</strong>. Kliknij link w
            wiadomości, aby aktywować konto.
          </p>

          <div className="bg-surface-2 border border-line rounded-xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-white mb-2">
              Nie widzisz maila?
            </p>
            <ul className="text-[0.78rem] text-subtle space-y-1.5 list-none p-0 m-0">
              <li>Sprawdź folder spam / oferty</li>
              <li>Poczekaj 1–2 minuty</li>
              <li>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-accent font-semibold hover:text-violet-300 transition-colors cursor-pointer bg-transparent border-0 font-sans p-0 text-[0.78rem]"
                >
                  {resending
                    ? 'Wysyłanie...'
                    : 'Wyślij ponownie'}
                </button>
              </li>
            </ul>
            {resendMsg && (
              <p className="mt-3 text-xs text-green-400">{resendMsg}</p>
            )}
          </div>

          <Link
            to="/login"
            className="block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
          >
            Przejdź do logowania →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_40%,rgba(124,58,237,0.08)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[460px] bg-surface border border-line rounded-2xl p-11 animate-scale-in">
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
          Utwórz konto
        </h1>
        <p className="text-sm text-subtle mb-8">
          Dołącz do platformy i zacznij przygotowania do egzaminu.
        </p>

        {error && (
          <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-[0.82rem] font-medium text-subtle mb-2">
              Imię i nazwisko
            </label>
            <input
              type="text"
              className={INPUT}
              placeholder="Jan Kowalski"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
            <label className="block text-[0.82rem] font-medium text-subtle mb-2">
              Hasło
            </label>
            <input
              type="password"
              className={INPUT}
              placeholder="Min. 8 znaków"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-[0.82rem] font-medium text-subtle mb-2">
              Jestem...
            </label>
            <select
              className={SELECT}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Uczniem — szukam korepetytora</option>
              <option value="tutor">Korepetytorem — chcę uczyć</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] cursor-pointer border-0 font-sans ${loading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {loading ? 'Rejestracja...' : 'Zarejestruj się bezpłatnie →'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-6">
          Masz już konto?{' '}
          <Link
            to="/login"
            className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
          >
            Zaloguj się
          </Link>
        </p>

        <p className="mt-6 text-[0.73rem] text-faint text-center leading-[1.6]">
          Tworząc konto zgadzasz się z naszym{' '}
          <Link
            to="/terms"
            className="text-subtle hover:text-white transition-colors"
          >
            Regulaminem
          </Link>{' '}
          i{' '}
          <Link
            to="/privacy-policy"
            className="text-subtle hover:text-white transition-colors"
          >
            Polityką prywatności
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

export default Register
