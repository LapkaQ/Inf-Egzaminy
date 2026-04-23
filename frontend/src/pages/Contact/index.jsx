import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

const GRAD = 'bg-gradient-to-br from-accent to-accent-2'
const GRAD_TEXT = `${GRAD} bg-clip-text text-transparent`
const LABEL =
  'text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent'
const INPUT =
  'w-full bg-surface-2 border border-line rounded-xl px-4 py-3 text-sm text-white placeholder:text-faint outline-none focus:border-accent/50 transition-all duration-200 font-sans'

const useReveal = () => {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.06 },
    )
    root
      .querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return ref
}

export const Contact = () => {
  const ref = useReveal()
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError('')
    setSuccess('')
    try {
      const result = await api.post('/contact/', form)
      setSuccess(result.message)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      setError(err.message || 'Nie udało się wysłać wiadomości. Spróbuj ponownie.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div ref={ref} className="bg-page text-white min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-[140px] pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="hero-grid" />
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.15)_0%,transparent_70%)] blur-[40px]" />
        </div>

        <div className="max-w-4xl mx-auto px-8 relative z-10">
          <div className="reveal text-center">
            <div className={`${LABEL} mb-4`}>Skontaktuj się</div>
            <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.1] mb-5">
              Napisz{' '}
              <span className={GRAD_TEXT}>do nas</span>
            </h1>
            <p className="text-subtle text-[1.05rem] max-w-[560px] mx-auto leading-[1.7]">
              Masz pytanie, sugestię lub problem? Wypełnij formularz, a
              odpowiemy najszybciej jak to możliwe.
            </p>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── FORM + INFO ──────────────────────────────────────────────────── */}
      <section className="py-16 max-w-4xl mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact form */}
          <div className="lg:col-span-3 reveal">
            <div className="bg-surface border border-line rounded-2xl p-8">
              <h2 className="text-lg font-bold mb-1">Formularz kontaktowy</h2>
              <p className="text-subtle text-xs mb-6">
                Wszystkie pola są wymagane. Odpowiadamy w ciągu 24 godzin.
              </p>

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/25 text-green-300 text-sm animate-fade-up">
                  ✅ {success}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                  {error}
                  <button
                    type="button"
                    className="ml-3 underline cursor-pointer bg-transparent border-0 text-red-200 font-sans"
                    onClick={() => setError('')}
                  >
                    Zamknij
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-subtle block mb-1.5">
                      Imię i nazwisko
                    </label>
                    <input
                      name="name"
                      className={INPUT}
                      placeholder="Jan Kowalski"
                      value={form.name}
                      onChange={handleChange}
                      required
                      minLength={2}
                      maxLength={255}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-subtle block mb-1.5">
                      Adres e-mail
                    </label>
                    <input
                      name="email"
                      type="email"
                      className={INPUT}
                      placeholder="jan@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-subtle block mb-1.5">
                    Temat wiadomości
                  </label>
                  <input
                    name="subject"
                    className={INPUT}
                    placeholder="np. Pytanie o korepetycje z INF.04"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    minLength={3}
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="text-xs text-subtle block mb-1.5">
                    Treść wiadomości
                  </label>
                  <textarea
                    name="message"
                    className={`${INPUT} min-h-[160px] resize-y`}
                    placeholder="Opisz swoje pytanie lub problem..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={5000}
                  />
                  <p className="text-xs text-faint mt-1 text-right">
                    {form.message.length} / 5000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className={`w-full px-6 py-3.5 rounded-xl text-sm font-semibold text-white ${GRAD} hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] transition-all duration-200 cursor-pointer border-0 font-sans disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Wysyłanie...
                    </span>
                  ) : (
                    '📩 Wyślij wiadomość'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Contact info sidebar */}
          <div className="lg:col-span-2 space-y-5">
            <div className="reveal delay-1">
              <div className="bg-surface border border-line rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg mb-4">
                  📧
                </div>
                <div className="font-bold text-sm mb-1">E-mail</div>
                <p className="text-subtle text-sm">kontakt@inf-egzaminy.pl</p>
              </div>
            </div>

            <div className="reveal delay-2">
              <div className="bg-surface border border-line rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg mb-4">
                  ⏱️
                </div>
                <div className="font-bold text-sm mb-1">Czas odpowiedzi</div>
                <p className="text-subtle text-sm">
                  Odpowiadamy w ciągu 24 godzin w dni robocze.
                </p>
              </div>
            </div>

            <div className="reveal delay-3">
              <div className="bg-surface border border-line rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-lg mb-4">
                  📍
                </div>
                <div className="font-bold text-sm mb-1">Adres</div>
                <p className="text-subtle text-sm">
                  ul. Wierzbowa 3a/1
                  <br />
                  15-743 Białystok
                </p>
              </div>
            </div>

            <div className="reveal delay-4">
              <div className="p-px bg-gradient-to-br from-accent/50 to-accent-2/50 rounded-2xl">
                <div className="bg-surface rounded-[14px] p-6">
                  <div className="font-bold text-sm mb-2">Szybkie linki</div>
                  <div className="space-y-2">
                    <Link
                      to="/terms"
                      className="block text-sm text-subtle hover:text-white transition-colors"
                    >
                      📄 Regulamin
                    </Link>
                    <Link
                      to="/privacy-policy"
                      className="block text-sm text-subtle hover:text-white transition-colors"
                    >
                      🔒 Polityka prywatności
                    </Link>
                    <Link
                      to="/tutors"
                      className="block text-sm text-subtle hover:text-white transition-colors"
                    >
                      👨‍🏫 Korepetytorzy
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-line py-12">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between flex-wrap gap-3 text-[0.8rem] text-faint">
            <span>© 2026 inf-egzaminy.pl — Wojciech Gawryluk. Wszelkie prawa zastrzeżone.</span>
            <span>by lapkaq</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Contact
