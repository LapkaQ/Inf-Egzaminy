import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/auth'
import { APP_NAME } from '../../config'

const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-white placeholder:text-faint outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)] font-sans'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
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

        {sent ? (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto text-4xl mb-6 animate-scale-in">
              📧
            </div>
            <h1 className="text-[1.5rem] font-black tracking-[-0.04em] mb-3 text-white text-center">
              Sprawdź pocztę
            </h1>
            <p className="text-sm text-subtle mb-8 text-center leading-relaxed">
              Jeśli konto o podanym adresie <strong className="text-white">{email}</strong> istnieje, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową (i folder spam).
            </p>
            <Link
              to="/login"
              className="block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
            >
              Wróć do logowania →
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-[1.6rem] font-black tracking-[-0.04em] mb-1.5 text-white">
              Zapomniałeś hasła?
            </h1>
            <p className="text-sm text-subtle mb-8">
              Podaj swój adres email, a wyślemy Ci link do resetowania hasła.
            </p>

            {error && (
              <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] cursor-pointer border-0 font-sans ${loading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {loading ? 'Wysyłanie...' : 'Wyślij link resetujący →'}
              </button>
            </form>

            <p className="text-center text-sm text-subtle mt-6">
              Pamiętasz hasło?{' '}
              <Link
                to="/login"
                className="text-violet-400 font-semibold hover:text-violet-300 transition-colors"
              >
                Zaloguj się
              </Link>
            </p>
          </>
        )}

        <div className="mt-8 p-4 bg-surface-2 rounded-xl border border-line text-center text-[0.75rem] text-faint">
          Link do resetowania hasła wygasa po 1 godzinie
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
