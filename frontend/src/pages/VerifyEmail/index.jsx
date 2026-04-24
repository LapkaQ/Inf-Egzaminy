import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authService } from '../../services/auth'
import { APP_NAME } from '../../config'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error | already
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Brak tokena weryfikacji w linku.')
      return
    }

    authService
      .verifyEmail(token)
      .then((data) => {
        setMessage(data.message)
        if (data.message.includes('już wcześniej')) {
          setStatus('already')
        } else {
          setStatus('success')
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Weryfikacja nie powiodła się.')
      })
  }, [searchParams])

  const icon = {
    loading: (
      <div className="w-16 h-16 rounded-full border-3 border-accent border-t-transparent animate-spin mx-auto" />
    ),
    success: (
      <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto text-4xl animate-scale-in">
        ✅
      </div>
    ),
    already: (
      <div className="w-20 h-20 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto text-4xl animate-scale-in">
        ℹ️
      </div>
    ),
    error: (
      <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-4xl animate-scale-in">
        ❌
      </div>
    ),
  }

  const title = {
    loading: 'Weryfikacja...',
    success: 'Email potwierdzony!',
    already: 'Już potwierdzony',
    error: 'Błąd weryfikacji',
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-5 py-28 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_40%,rgba(124,58,237,0.08)_0%,transparent_60%),radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px] bg-surface border border-line rounded-2xl p-11 text-center animate-scale-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-sm font-black">
            {APP_NAME.charAt(0)}
          </div>
          <span className="font-extrabold text-white tracking-tight">
            {APP_NAME}
          </span>
        </div>

        <div className="mb-6">{icon[status]}</div>

        <h1 className="text-[1.5rem] font-black tracking-[-0.04em] mb-3 text-white">
          {title[status]}
        </h1>

        <p className="text-sm text-subtle mb-8 leading-relaxed">{message}</p>

        {(status === 'success' || status === 'already') && (
          <Link
            to="/login"
            className="inline-block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
          >
            Zaloguj się →
          </Link>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-3.5 rounded-xl bg-gradient-to-br from-accent to-accent-2 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] no-underline"
            >
              Wróć do logowania
            </Link>
            <Link
              to="/register"
              className="block text-sm text-violet-400 font-semibold hover:text-violet-300 transition-colors"
            >
              Zarejestruj się ponownie
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
