import React, { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth'
import { APP_NAME } from '../../config'

const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-white placeholder:text-faint outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] font-sans'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków.')
      return
    }
    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne.')
      return
    }
    if (!token) {
      setError('Brak tokena resetowania w linku.')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Resetowanie hasła nie powiodło się.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_40%,rgba(124,58,237,0.08)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 w-full max-w-[440px] bg-surface border border-line rounded-2xl p-11 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-4xl mb-6">
            ❌
          </div>
          <h1 className="text-[1.5rem] font-black tracking-[-0.04em] mb-3 text-white">
            Nieprawidłowy link
          </h1>
          <p className="text-sm text-subtle mb-8">
            Link do resetowania hasła jest nieprawidłowy lub niepełny. Spróbuj ponownie.
          </p>
          <Link
            to="/forgot-password"
            className="block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
          >
            Poproś o nowy link →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
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

        {success ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto text-4xl mb-6 animate-scale-in">
              ✅
            </div>
            <h1 className="text-[1.5rem] font-black tracking-[-0.04em] mb-3 text-white text-center">
              Hasło zmienione!
            </h1>
            <p className="text-sm text-subtle mb-8 text-center">
              Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować.
            </p>
            <Link
              to="/login"
              className="block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
            >
              Zaloguj się →
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[1.6rem] font-black tracking-[-0.04em] mb-1.5 text-white">
              Ustaw nowe hasło
            </h1>
            <p className="text-sm text-subtle mb-8">
              Wprowadź nowe hasło dla swojego konta.
            </p>

            {error && (
              <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[0.82rem] font-medium text-subtle mb-2">
                  Nowe hasło
                </label>
                <input
                  type="password"
                  className={INPUT}
                  placeholder="Min. 8 znaków"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-[0.82rem] font-medium text-subtle mb-2">
                  Powtórz hasło
                </label>
                <input
                  type="password"
                  className={INPUT}
                  placeholder="Powtórz nowe hasło"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] cursor-pointer border-0 font-sans ${loading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {loading ? 'Zmiana hasła...' : 'Zmień hasło →'}
              </button>
            </form>
          </>
        )}

        <div className="mt-8 p-4 bg-surface-2 rounded-xl border border-line text-center text-[0.75rem] text-faint">
          🔒 Twoje nowe hasło jest szyfrowane i bezpieczne
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
