import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import { APP_NAME } from '../../config'

/* Reusable Tailwind strings */
const GRAD = 'bg-gradient-to-br from-accent to-accent-2'
const GRAD_TEXT = `${GRAD} bg-clip-text text-transparent`
/* Osobno od .reveal; podnoszenie: `.card-hover-lift` w index.css (tylko transform, bez animacji cienia). */
const CARD =
  'card-hover-lift bg-surface border border-line rounded-2xl p-7 h-full hover:border-accent/40 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]'
const LABEL =
  'text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent'
const BTN_PRI = `inline-flex items-center gap-2 px-7 py-3.5 rounded-xl ${GRAD} text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)]`
const BTN_OUT =
  'inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-line-hi text-subtle font-medium text-sm transition-all duration-200 hover:text-white hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-0.5'
const TAG =
  'px-2.5 py-1 bg-surface-3 border border-line-hi rounded-md text-[0.73rem] text-subtle font-medium'

const FEATURES = [
  {
    icon: '🎯',
    title: 'INF.03 i INF.04',
    desc: 'Specjalizujemy się wyłącznie w egzaminach zawodowych z kwalifikacji informatycznych technika informatyka.',
  },
  {
    icon: '👤',
    title: 'Indywidualne podejście',
    desc: 'Każdy uczeń jest inny. Korepetytor dostosuje tempo i zakres materiału do Twoich potrzeb.',
  },
  {
    icon: '📅',
    title: 'Elastyczny kalendarz',
    desc: 'Rezerwuj lekcje kiedy chcesz. System kalendarza online z zarządzaniem dostępnością korepetytora.',
  },
  {
    icon: '✅',
    title: 'Weryfikowani korepetytorzy',
    desc: 'Każdy korepetytor posiada udokumentowane doświadczenie i wysoką zdawalność swoich uczniów.',
  },
  {
    icon: '💬',
    title: 'Feedback po lekcji',
    desc: 'Po każdej sesji otrzymasz podsumowanie postępów i wskazówki do dalszej nauki.',
  },
  {
    icon: '🔐',
    title: 'Bezpieczna platforma',
    desc: 'Transparentne płatności, bezpieczne dane i wygodna komunikacja w jednym miejscu.',
  },
]

const STEPS = [
  {
    n: '01',
    title: 'Znajdź korepetytora',
    desc: 'Przeglądaj profile i wybierz specjalistę od INF.03 lub INF.04, który pasuje Ci stylem.',
  },
  {
    n: '02',
    title: 'Zarezerwuj termin',
    desc: 'Wybierz wolny slot z kalendarza korepetytora i potwierdź rezerwację jednym kliknięciem.',
  },
  {
    n: '03',
    title: 'Ucz się i zdawaj',
    desc: 'Odbywaj lekcje, ćwicz materiał i monitoruj postępy aż do dnia egzaminu.',
  },
  {
    n: '04',
    title: 'Zdaj za 1. razem',
    desc: 'Nasi absolwenci osiągają zdawalność powyżej 97%. Twoja kolej.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Kacper M.',
    role: 'Zdał INF.03 — 91%',
    text: 'Dzięki korepetycjom z Pawłem zrozumiałem sieci w 2 tygodnie. Egzamin poszedł mi lepiej niż kiedykolwiek się spodziewałem.',
    init: 'KM',
  },
  {
    name: 'Zuzanna R.',
    role: 'Zdała INF.04 — 88%',
    text: 'Wcześniej bałam się Pythona. Korepetytor pokazał mi, że to prostsze niż myślałam. Teraz piszę skrypty w kilka minut.',
    init: 'ZR',
  },
  {
    name: 'Michał T.',
    role: 'Zdał INF.03 i INF.04',
    text: 'Platforma jest super wygodna. Znalazłem korepetytora, zarezerwowałem termin i już na pierwszej lekcji wiedziałem, że to był dobry wybór.',
    init: 'MT',
  },
]

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

export const Home = () => {
  const ref = useReveal()

  const [stats, setStats] = useState(null)
  useEffect(() => {
    api
      .get('/stats/')
      .then(setStats)
      .catch(() => {})
  }, [])

  const statsItems = [
    {
      val: stats ? `${stats.active_students}+` : '…',
      label: 'aktywnych uczniów',
    },
    {
      val: stats ? `${stats.pass_rate_percent}%` : '…',
      label: 'zdawalność egzaminów',
    },
    { val: stats ? `${stats.tutors_count}+` : '…', label: 'korepetytorów' },
    { val: stats ? `${stats.avg_tutor_rating}★` : '…', label: 'średnia ocena' },
  ]

  return (
    <div ref={ref} className="bg-page text-white min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden py-[120px] pb-20">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="hero-grid" />
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.2)_0%,transparent_70%)] blur-[40px]" />
          <div className="absolute top-[30%] left-[-10%] w-[400px] h-[400px] bg-[radial-gradient(ellipse,rgba(59,130,246,0.12)_0%,transparent_70%)] blur-[60px]" />
        </div>

        <div className="max-w-6xl mx-auto px-8 relative z-10 w-full">
          <div className="text-center max-w-[860px] mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-xs font-semibold text-violet-300 tracking-wider animate-fade-in">
              <span className="badge-dot" />
              Platforma korepetycji · INF.03 & INF.04
            </div>

            <h1 className="text-[clamp(3rem,7vw,5.5rem)] font-black leading-[1.05] tracking-[-0.04em] mt-5 mb-6 animate-fade-up [animation-delay:0.1s]">
              Zdaj egzaminy
              <br />
              <span className={GRAD_TEXT}>za pierwszym razem</span>
            </h1>

            <p className="text-[clamp(1rem,2vw,1.2rem)] text-subtle max-w-[560px] mx-auto mb-10 leading-[1.7] animate-fade-up [animation-delay:0.2s]">
              Profesjonalne korepetycje z kwalifikacji technika informatyka.
              Weryfikowani nauczyciele, elastyczny kalendarz, gwarantowane
              wyniki.
            </p>

            <div className="flex items-center justify-center gap-3.5 flex-wrap mb-16 animate-fade-up [animation-delay:0.3s]">
              <Link
                to="/tutors"
                className={`${BTN_PRI} text-base px-8 py-4 rounded-xl`}
              >
                Znajdź korepetytora →
              </Link>
              <Link
                to="/register"
                className={`${BTN_OUT} text-base px-8 py-4 rounded-xl`}
              >
                Zacznij za darmo
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-16 flex-wrap pt-12 border-t border-line animate-fade-up [animation-delay:0.45s]">
              {statsItems.map((s) => (
                <div key={s.label}>
                  <strong
                    className={`block text-[2.2rem] font-black tracking-[-0.04em] ${GRAD_TEXT}`}
                  >
                    {s.val}
                  </strong>
                  <span className="text-[0.82rem] text-subtle font-medium">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXAM FOCUS ────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-8">
        <div className="reveal text-center mb-12">
          <div className={`${LABEL} mb-3`}>Nasze specjalizacje</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-[-0.04em]">
            Dwa egzaminy. Jedna platforma.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              num: '03',
              label: 'Kwalifikacja INF.03',
              title:
                'Tworzenie i administrowanie stronami i aplikacjami WWW oraz bazami danych',
              desc: 'HTML, CSS, JavaScript, PHP, SQL, MySQL, systemy CMS. Część praktyczna i teoretyczna.',
              tags: ['HTML/CSS', 'JavaScript', 'PHP', 'MySQL', 'CMS', 'Sieci'],
              side: 'reveal-left',
            },
            {
              num: '04',
              label: 'Kwalifikacja INF.04',
              title: 'Projektowanie, programowanie i testowanie aplikacji',
              desc: 'Python, Java, C++, algorytmy, bazy danych, wzorce projektowe, testowanie kodu.',
              tags: ['Python', 'Java', 'C++', 'Algorytmy', 'OOP', 'Testowanie'],
              side: 'reveal-right',
            },
          ].map((e) => (
            // Gradient border: outer div with gradient bg + p-px, inner div with surface bg
            <div
              key={e.num}
              className={`${e.side} p-px bg-gradient-to-br from-accent/50 to-accent-2/50 rounded-2xl`}
            >
              <div className="relative bg-surface rounded-[14px] p-10 overflow-hidden h-full">
                <span className="absolute top-4 right-6 text-[5rem] font-black leading-none text-white/[0.04]">
                  {e.num}
                </span>
                <div className={`${LABEL} mb-3`}>{e.label}</div>
                <h3 className="text-[1.35rem] font-black tracking-[-0.03em] mb-3.5 leading-tight">
                  {e.title}
                </h3>
                <p className="text-sm text-subtle leading-[1.7] mb-6">
                  {e.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {e.tags.map((t) => (
                    <span key={t} className={TAG}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-8">
        <div className="reveal mb-14 max-w-[520px]">
          <div className={`${LABEL} mb-3`}>Dlaczego {APP_NAME}?</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black tracking-[-0.04em] leading-[1.15]">
            Wszystko czego potrzebujesz do zdania egzaminu
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`reveal delay-${i + 1} h-full min-h-0`}
            >
              <div className={CARD}>
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl mb-5">
                  {f.icon}
                </div>
                <div className="font-bold text-[1.05rem] tracking-[-0.02em] mb-2.5">
                  {f.title}
                </div>
                <div className="text-[0.875rem] text-subtle leading-[1.7]">
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-8">
        <div className="reveal text-center mb-16">
          <div className={`${LABEL} mb-3`}>Jak to działa?</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black tracking-[-0.04em]">
            Prosto i bez zbędnych kroków
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`reveal delay-${i + 1}`}>
              {/* opacity-30 doesn't work on bg-clip-text — use color with alpha instead */}
              <div className="text-[3.5rem] font-black tracking-[-0.05em] text-white/20 leading-none mb-4">
                {s.n}
              </div>
              <div className="font-bold text-[1rem] mb-2">{s.title}</div>
              <div className="text-[0.85rem] text-subtle leading-[1.65]">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-line-hi to-transparent" />

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-24 max-w-6xl mx-auto px-8">
        <div className="reveal text-center mb-14">
          <div className={`${LABEL} mb-3`}>Opinie uczniów</div>
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black tracking-[-0.04em]">
            Mówią sami za siebie
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`reveal delay-${i + 1} h-full min-h-0`}
            >
              <div className={CARD}>
                <div className="flex gap-0.5 text-amber-400 text-sm mb-4">
                  ★★★★★
                </div>
                <p className="text-[0.92rem] text-subtle leading-[1.75] mb-5">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${GRAD} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                  >
                    {t.init}
                  </div>
                  <div>
                    <div className="text-[0.87rem] font-semibold">{t.name}</div>
                    <div className="text-[0.78rem] text-subtle">{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-8">
          <div className="reveal relative bg-surface/30 border border-accent/25 rounded-3xl py-[72px] px-12 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/5 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
            <div className={`${LABEL} mb-5`}>Zacznij już dziś</div>
            <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-black tracking-[-0.05em] max-w-xl mx-auto mb-5 leading-[1.1]">
              Twój egzamin jest bliżej
              <br />
              <span className={GRAD_TEXT}>niż myślisz</span>
            </h2>
            <p className="text-subtle mb-9 text-[1rem]">
              Dołącz do setek uczniów, którzy już zdali dzięki naszej
              platformie.
            </p>
            <div className="flex justify-center gap-3.5 flex-wrap">
              <Link
                to="/register"
                className={`${BTN_PRI} text-base px-8 py-4 rounded-xl`}
              >
                Zarejestruj się za darmo →
              </Link>
              <Link
                to="/tutors"
                className={`${BTN_OUT} text-base px-8 py-4 rounded-xl`}
              >
                Przeglądaj korepetytorów
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-line py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2.5 font-extrabold text-white mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center text-white text-sm font-black">
                  {APP_NAME.charAt(0)}
                </div>
                {APP_NAME}
              </div>
              <p className="text-sm text-subtle leading-[1.7] max-w-[280px]">
                Platforma korepetycji skupiona wyłącznie na egzaminach
                zawodowych INF.03 i INF.04.
              </p>
            </div>
            {[
              {
                title: 'Platforma',
                links: [
                  { label: 'Korepetytorzy', to: '/tutors', disabled: false },
                  { label: 'Zarejestruj się', to: '/register', disabled: false },
                  { label: 'Zaloguj się', to: '/login', disabled: false },
                ],
              },
              {
                title: 'Egzaminy',
                links: [
                  { label: 'INF.03', to: '#' , disabled: true },
                  { label: 'INF.04', to: '#' , disabled: true},
                  { label: 'Materiały', to: '#' , disabled: true},
                ],
              },
              {
                title: 'Kontakt',
                links: [
                  { label: 'Formularz kontaktowy', to: '/contact', disabled: false },
                  { label: 'kontakt@inf-egzaminy.pl', to: '#', disabled: false },
                  { label: 'Regulamin', to: '/terms', disabled: false },
                  { label: 'Polityka prywatności', to: '/privacy-policy', disabled: false },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-[0.78rem] font-bold text-white uppercase tracking-[0.06em] mb-4">
                  {col.title}
                </div>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    className={`block text-[0.85rem] text-subtle hover:text-white transition-colors duration-200 mb-2.5 ${l.disabled ? 'opacity-50 cursor-not-allowed ' : ''}  `}
                    to={l.to}
                    onClick={(e) => {
                      if (l.disabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 pt-8 border-t border-line text-[0.8rem] text-faint">
            <span>© 2026 {APP_NAME}. Wszelkie prawa zastrzeżone.</span>
            <span>by lapkaq</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
