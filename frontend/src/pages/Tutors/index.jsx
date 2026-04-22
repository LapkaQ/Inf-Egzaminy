import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getAllTutors } from '../../services/tutors'

const GRAD = 'bg-gradient-to-br from-accent to-accent-2'
const TAG =
  'px-2.5 py-1 bg-surface-3 border border-line-hi rounded-md text-[0.73rem] text-subtle font-medium'
const FILTERS = ['Wszyscy', 'INF03', 'INF04']

// Setup IntersectionObserver on a container — adds .visible to .card-reveal children
const useRevealGrid = (deps) => {
  const ref = useRef(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    root
      .querySelectorAll('.card-reveal')
      .forEach((el) => el.classList.remove('visible'))
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.04 },
    )
    const tid = setTimeout(
      () =>
        root.querySelectorAll('.card-reveal').forEach((el) => obs.observe(el)),
      40,
    )
    return () => {
      clearTimeout(tid)
      obs.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}

// Build initials from full name
const initials = (name = '') =>
  name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

// Map subject name from backend → display tag
const subjectLabel = (name) => {
  if (name === 'INF03') return 'INF.03'
  if (name === 'INF04') return 'INF.04'
  return name
}

export const Tutors = () => {
  const [tutors, setTutors] = useState([])
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('Wszyscy')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllTutors()
      .then((data) => setTutors(data))
      .catch(() => setError('Nie udało się pobrać listy korepetytorów.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tutors.filter((t) => {
    const q = search.toLowerCase()
    const matchSearch =
      (t.name || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q)
    const matchFilter =
      active === 'Wszyscy' ||
      (t.tutor_profile?.subjects || []).some((s) => s.name === active)
    return matchSearch && matchFilter
  })

  const gridRef = useRevealGrid([filtered.length, search, active, loading])

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      {/* Header */}
      <section className="py-16 pb-10 border-b border-line">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent mb-3 animate-fade-in">
            Platforma korepetycji
          </div>
          <h1 className="text-[clamp(2rem,5vw,3rem)] font-black tracking-[-0.04em] mb-3 animate-fade-up [animation-delay:0.1s]">
            Znajdź swojego{' '}
            <span className="bg-gradient-to-br from-accent to-accent-2 bg-clip-text text-transparent">
              korepetytora
            </span>
          </h1>
          <p className="text-subtle animate-fade-up [animation-delay:0.2s]">
            {loading
              ? 'Ładowanie...'
              : `Wybierz spośród ${tutors.length} weryfikowanych specjalistów od INF.03 i INF.04.`}
          </p>
        </div>
      </section>

      {/* Sticky filters */}
      <div className="sticky top-[68px] z-10 bg-page/95 backdrop-blur-xl border-b border-line py-4">
        <div className="max-w-6xl mx-auto px-8 flex flex-wrap items-center gap-4">
          <input
            type="text"
            className="bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-faint outline-none focus:border-accent/50 transition-all duration-200 w-80 font-sans"
            placeholder="Szukaj po nazwisku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`px-4 py-2 rounded-lg border text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 font-sans ${active === f ? 'bg-accent border-accent text-white' : 'bg-transparent border-line-hi text-subtle hover:text-white hover:border-white/30'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[0.82rem] text-faint">
            {loading ? '...' : `${filtered.length} wyników`}
          </span>
        </div>
      </div>

      {/* Grid */}
      <section className="py-16 max-w-6xl mx-auto px-8">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-line rounded-2xl p-7 h-[320px] animate-pulse"
              >
                <div className="w-16 h-16 rounded-full bg-surface-3 mb-4" />
                <div className="h-4 bg-surface-3 rounded mb-2 w-3/4" />
                <div className="h-3 bg-surface-3 rounded mb-6 w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-surface-3 rounded w-full" />
                  <div className="h-3 bg-surface-3 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-subtle">
            <div className="text-4xl mb-4">🔍</div>
            <p>
              {tutors.length === 0
                ? 'Brak korepetytorów w systemie.'
                : 'Brak wyników dla podanej frazy.'}
            </p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map((tutor, i) => (
              <div
                key={tutor.id}
                className="card-reveal"
                style={{ transitionDelay: `${i * 0.07}s` }}
              >
                <div className="bg-surface border border-line rounded-2xl p-7 flex flex-col h-full hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)] transition-all duration-300">
                  {/* Avatar */}
                  <div
                    className={`w-[68px] h-[68px] rounded-full ${GRAD} flex items-center justify-center text-white text-xl font-black mb-4 border-2 border-accent/30 shrink-0`}
                    onClick={() => console.log(tutor)}
                  >
                    {initials(tutor.name)}
                  </div>

                  <div className="font-bold text-[1.05rem] mb-0.5 flex justify-between items-center">
                    <span>{tutor.name}</span>
                    <span className="text-accent text-sm">{tutor.tutor_profile?.price_per_hour || 0} zł/h</span>
                  </div>
                  <div className="text-[0.78rem] text-subtle mb-3">
                    {tutor.email}
                  </div>
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {tutor.tutor_profile?.subjects?.map((s) => (
                      <span key={s.name} className={TAG}>
                        {subjectLabel(s.name)}
                      </span>
                    ))}
                  </div>
                  <p className="text-[0.82rem] text-subtle leading-[1.65] mb-4 flex-grow line-clamp-3">
                    {tutor.tutor_profile?.bio || 'Brak opisu profilu.'}
                  </p>

                  {/* Rating / Active */}
                  {/* <div className="flex items-center justify-between pt-4 border-t border-line mb-4">
                    <span className="text-[0.85rem] text-amber-400 font-semibold flex items-center gap-1">
                      ★ {tutor.tutor_profile?.rating_avg || 'Brak ocen'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/25 rounded-full text-[0.7rem] text-green-400 font-semibold">
                      ● Aktywny
                    </span>
                  </div> */}

                  <Link
                    to={`/tutors/${tutor.id}`}
                    className="w-full py-2.5 rounded-xl border border-line-hi text-subtle text-sm font-medium text-center hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    Zobacz profil i sloty →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Tutors
