import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getMyBookings, getMySlots, addSlot, deleteSlot,
  createTutorProfile, updateTutorProfile, getTutorById
} from '../../services/tutors';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';
const INPUT = 'w-full bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-faint outline-none focus:border-accent/50 transition-all duration-200 font-sans';

const statusLabel = (s) => ({ pending: 'Oczekuje', confirmed: 'Potwierdzone', cancelled: 'Anulowane', completed: 'Zakończone' }[s] || s);
const statusColor = (s) => ({ pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25', confirmed: 'text-green-400 bg-green-400/10 border-green-400/25', cancelled: 'text-red-400 bg-red-400/10 border-red-400/25', completed: 'text-subtle bg-surface-2 border-line' }[s] || 'text-subtle');

const formatDt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
  };
};

// Format datetime-local input value to ISO string
const toIso = (val) => new Date(val).toISOString();

export const TutorDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings]     = useState([]);
  const [slots, setSlots]           = useState([]);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('Przegląd');

  // Slot form
  const [slotStart, setSlotStart]   = useState('');
  const [slotEnd, setSlotEnd]       = useState('');
  const [slotError, setSlotError]   = useState('');
  const [slotLoading, setSlotLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Profile form
  const [bio, setBio]               = useState('');
  const [price, setPrice]           = useState('');
  const [subjects, setSubjects]     = useState([]);
  const [profMsg, setProfMsg]       = useState('');
  const [profError, setProfError]   = useState('');
  const [profLoading, setProfLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getMyBookings().catch(() => []),
      getMySlots().catch(() => []),
      getTutorById(user?.id).catch(() => null),
    ]).then(([b, s, p]) => {
      setBookings(b);
      setSlots(s);
      setProfile(p);
      if (p) { setBio(p.bio || ''); setPrice(p.price_per_hour || ''); setSubjects(p.subjects?.map(s => s.name) || []); }
    }).finally(() => setLoading(false));
  }, [user?.id]);

  // ── Slot handlers ──
  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSlotError('');
    if (!slotStart || !slotEnd) return setSlotError('Podaj oba terminy.');
    if (new Date(slotStart) >= new Date(slotEnd)) return setSlotError('Czas zakończenia musi być po czasie rozpoczęcia.');
    setSlotLoading(true);
    try {
      const newSlot = await addSlot(toIso(slotStart), toIso(slotEnd));
      setSlots(prev => [...prev, newSlot]);
      setSlotStart(''); setSlotEnd('');
    } catch (e) {
      setSlotError(e.message || 'Nie udało się dodać slotu.');
    } finally { setSlotLoading(false); }
  };

  const handleDeleteSlot = async (id) => {
    setDeletingId(id);
    try {
      await deleteSlot(id);
      setSlots(prev => prev.filter(s => s.id !== id));
    } catch {}
    finally { setDeletingId(null); }
  };

  // ── Profile handler ──
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfMsg(''); setProfError('');
    if (!price || isNaN(parseInt(price))) return setProfError('Podaj prawidłową cenę.');
    setProfLoading(true);
    try {
      const data = { bio, price_per_hour: parseInt(price), subjects };
      const saved = profile
        ? await updateTutorProfile(data)
        : await createTutorProfile(bio, parseInt(price), subjects);
      setProfile(saved);
      setProfMsg('Profil zapisany pomyślnie!');
    } catch (e) {
      setProfError(e.message || 'Nie udało się zapisać profilu.');
    } finally { setProfLoading(false); }
  };

  const toggleSubject = (s) => setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const upcoming  = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.start_time) > new Date());
  const futureSlots = slots.filter(s => new Date(s.start_time) > new Date());
  const TABS = ['Przegląd', 'Terminy', 'Profil'];

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-6xl mx-auto px-8 py-10 pb-20">

        {/* Greeting */}
        <div className="mb-9 animate-fade-up">
          <div className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent mb-2">Panel korepetytora</div>
          <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-black tracking-[-0.04em]">
            Cześć, {user?.name?.split(' ')[0]} 🎓
          </h1>
          <p className="text-subtle text-sm mt-1.5">
            Masz <strong className="text-white">{upcoming.length}</strong> nadchodzących lekcji ·{' '}
            <strong className="text-white">{futureSlots.length}</strong> wolnych slotów
          </p>
        </div>

        {/* Tabs */}
        <div className="inline-flex bg-surface border border-line rounded-xl p-1 gap-1 mb-8">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-sans cursor-pointer transition-all duration-200 ${tab === t ? 'bg-surface-3 text-white font-semibold' : 'bg-transparent text-subtle hover:text-white font-medium'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── PRZEGLĄD ── */}
        {tab === 'Przegląd' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Nadchodzące lekcje', value: upcoming.length,     icon: '📅' },
                { label: 'Wolne sloty',         value: futureSlots.length,  icon: '🗓️' },
                { label: 'Łącznie lekcji',      value: bookings.length,     icon: '📚' },
                { label: 'Cena / godz.',         value: profile ? `${profile.price_per_hour} zł` : '—', icon: '💰' },
              ].map(s => (
                <div key={s.label} className="bg-surface border border-line rounded-2xl p-5">
                  <div className="text-xl mb-2">{s.icon}</div>
                  <div className="text-[0.78rem] text-subtle font-medium mb-1.5">{s.label}</div>
                  <div className={`text-[1.6rem] font-black tracking-[-0.04em] ${GRAD} bg-clip-text text-transparent`}>{loading ? '—' : s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="flex flex-col gap-6">
                {/* Upcoming bookings */}
                <div className="bg-surface border border-line rounded-2xl p-7">
                  <h2 className="font-bold text-[1rem] mb-5">Nadchodzące lekcje (uczniowie)</h2>
                  {loading ? (
                    <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}</div>
                  ) : upcoming.length === 0 ? (
                    <div className="text-center py-10 text-subtle text-sm">
                      <div className="text-3xl mb-3">🎓</div>
                      <p>Brak nadchodzących lekcji. Dodaj terminy, żeby uczniowie mogli je rezerwować.</p>
                      <button onClick={() => setTab('Terminy')} className="mt-3 text-accent cursor-pointer hover:underline bg-transparent border-0 font-sans">Dodaj terminy →</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {upcoming.map(b => {
                        const { date, time } = formatDt(b.start_time);
                        const { time: endTime } = formatDt(b.end_time);
                        return (
                          <div key={b.id} className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-line">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-lg ${GRAD} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                U{b.student_id}
                              </div>
                              <div>
                                <div className="font-semibold text-sm">Uczeń #{b.student_id}</div>
                                <div className="text-[0.74rem] text-subtle">{date} · {time} – {endTime}</div>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full border text-[0.7rem] font-semibold ${statusColor(b.status)}`}>
                              {statusLabel(b.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-5">
                <div className="bg-surface border border-line rounded-2xl p-6 text-center">
                  <div className={`w-16 h-16 rounded-full ${GRAD} flex items-center justify-center text-white text-xl font-black mx-auto mb-3 border-2 border-accent/25`}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="font-bold mb-0.5">{user?.name}</div>
                  <div className="text-[0.8rem] text-subtle mb-3">{user?.email}</div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-xs font-semibold text-violet-300">
                    🎓 Korepetytor
                  </span>
                </div>
                <div className="bg-surface border border-line rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-4">Szybkie akcje</h3>
                  <div className="flex flex-col gap-2.5">
                    <button onClick={() => setTab('Terminy')} className={`py-2.5 rounded-xl ${GRAD} text-white text-sm font-semibold cursor-pointer border-0 font-sans hover:-translate-y-0.5 transition-all duration-200`}>
                      Zarządzaj terminami →
                    </button>
                    <button onClick={() => setTab('Profil')} className="py-2.5 rounded-xl border border-line-hi text-subtle text-sm font-medium cursor-pointer bg-transparent font-sans hover:text-white hover:border-white/20 transition-all duration-200">
                      Edytuj profil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TERMINY ── */}
        {tab === 'Terminy' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
            {/* Existing slots */}
            <div>
              <h2 className="font-bold text-[1.1rem] mb-5">Twoje terminy ({slots.length})</h2>
              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}</div>
              ) : slots.length === 0 ? (
                <div className="bg-surface border border-line rounded-2xl p-10 text-center text-subtle">
                  <div className="text-3xl mb-3">📅</div>
                  <p className="text-sm">Brak terminów. Dodaj pierwszy slot obok.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {slots
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    .map(slot => {
                      const { date, time } = formatDt(slot.start_time);
                      const { time: endTime } = formatDt(slot.end_time);
                      const isPast = new Date(slot.start_time) <= new Date();
                      return (
                        <div key={slot.id} className={`flex items-center justify-between p-4 bg-surface border rounded-xl ${isPast ? 'border-line opacity-50' : 'border-line hover:border-accent/30'} transition-colors`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-faint' : 'bg-green-400'}`} />
                            <div>
                              <div className="text-sm font-medium capitalize">{date}</div>
                              <div className="text-[0.75rem] text-subtle">{time} – {endTime}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            disabled={deletingId === slot.id}
                            className="text-[0.75rem] text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-transparent border-0 font-sans disabled:opacity-50 px-2"
                          >
                            {deletingId === slot.id ? '...' : 'Usuń'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Add slot form */}
            <div className="bg-surface border border-line rounded-2xl p-7">
              <h3 className="font-bold text-[1rem] mb-1">Dodaj nowy termin</h3>
              <p className="text-[0.82rem] text-subtle mb-5">Ustaw przedział czasowy, który uczniowie będą mogli zarezerwować.</p>
              {slotError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">{slotError}</div>}
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-[0.82rem] font-medium text-subtle mb-2">Początek lekcji</label>
                  <input type="datetime-local" className={INPUT} value={slotStart} onChange={e => setSlotStart(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-[0.82rem] font-medium text-subtle mb-2">Koniec lekcji</label>
                  <input type="datetime-local" className={INPUT} value={slotEnd} onChange={e => setSlotEnd(e.target.value)} required />
                </div>
                <button
                  type="submit"
                  disabled={slotLoading}
                  className={`w-full py-3 rounded-xl ${GRAD} text-white font-semibold text-sm cursor-pointer border-0 font-sans transition-all duration-200 hover:-translate-y-0.5 ${slotLoading ? 'opacity-60' : ''}`}
                >
                  {slotLoading ? 'Dodawanie...' : 'Dodaj termin →'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── PROFIL ── */}
        {tab === 'Profil' && (
          <div className="max-w-xl">
            <h2 className="font-bold text-[1.1rem] mb-6">
              {profile ? 'Edytuj profil korepetytora' : 'Utwórz profil korepetytora'}
            </h2>
            {profMsg && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-sm">{profMsg}</div>}
            {profError && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">{profError}</div>}
            <form onSubmit={handleSaveProfile} className="bg-surface border border-line rounded-2xl p-7 space-y-5">
              <div>
                <label className="block text-[0.82rem] font-medium text-subtle mb-2">Bio (opis korepetytora)</label>
                <textarea
                  className={`${INPUT} resize-none h-28`}
                  placeholder="Przedstaw się uczniom. Kim jesteś, jakie masz doświadczenie, jaki masz styl nauki..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[0.82rem] font-medium text-subtle mb-2">Cena za godzinę (zł)</label>
                <input type="number" min={1} className={INPUT} placeholder="np. 80" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[0.82rem] font-medium text-subtle mb-3">Kwalifikacje</label>
                <div className="flex gap-3">
                  {['INF03', 'INF04'].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSubject(s)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all duration-200 font-sans ${
                        subjects.includes(s)
                          ? `${GRAD} border-transparent text-white`
                          : 'bg-transparent border-line-hi text-subtle hover:border-accent/50 hover:text-white'
                      }`}
                    >
                      {s === 'INF03' ? 'INF.03' : 'INF.04'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={profLoading}
                className={`w-full py-3.5 rounded-xl ${GRAD} text-white font-semibold text-sm cursor-pointer border-0 font-sans transition-all duration-200 hover:-translate-y-0.5 ${profLoading ? 'opacity-60' : ''}`}
              >
                {profLoading ? 'Zapisywanie...' : profile ? 'Zaktualizuj profil' : 'Utwórz profil →'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default TutorDashboard;
