import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getMyBookings, getMySlots, deleteSlot,
  createTutorProfile, updateTutorProfile, getTutorById,
  getMyWeeklySchedule, setWeeklySchedule,
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

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
const DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 – 21:00

/** Convert hour index to "HH:00" string */
const hourStr = (h) => `${String(h).padStart(2, '0')}:00`;
const timeStr = (h) => `${String(h).padStart(2, '0')}:00:00`; // for API

// ─── Weekly Schedule Builder Component ───
const WeeklyScheduleBuilder = ({ schedule, setSchedule, onSave, saving, saveMsg, saveError }) => {
  // schedule is a Map<dayOfWeek, Set<hour>>
  const [dragging, setDragging] = useState(false);
  const [dragMode, setDragMode] = useState(null); // 'add' or 'remove'

  const isSelected = (day, hour) => schedule.get(day)?.has(hour) ?? false;

  const toggleCell = useCallback((day, hour, forceMode = null) => {
    setSchedule(prev => {
      const next = new Map(prev);
      const daySet = new Set(next.get(day) || []);
      const mode = forceMode ?? (daySet.has(hour) ? 'remove' : 'add');
      if (mode === 'add') {
        daySet.add(hour);
      } else {
        daySet.delete(hour);
      }
      next.set(day, daySet);
      return next;
    });
  }, [setSchedule]);

  const handleMouseDown = (day, hour) => {
    const mode = isSelected(day, hour) ? 'remove' : 'add';
    setDragMode(mode);
    setDragging(true);
    toggleCell(day, hour, mode);
  };

  const handleMouseEnter = (day, hour) => {
    if (dragging && dragMode) {
      toggleCell(day, hour, dragMode);
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setDragMode(null);
  };

  // Attach global mouseup listener for drag outside grid
  useEffect(() => {
    const up = () => { setDragging(false); setDragMode(null); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const clearAll = () => setSchedule(new Map());

  const totalHours = [...schedule.values()].reduce((sum, set) => sum + set.size, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-[1.1rem]">Tygodniowy harmonogram</h2>
          <p className="text-[0.82rem] text-subtle mt-1">
            Kliknij lub przeciągnij po siatce, aby zaznaczyć godziny Twojej dostępności. 
            System automatycznie wygeneruje terminy na najbliższe 4 tygodnie.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.78rem] text-subtle">
            <strong className="text-white">{totalHours}</strong> godz. / tydzień
          </span>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg border border-line-hi text-subtle text-[0.75rem] font-medium cursor-pointer bg-transparent font-sans hover:text-red-400 hover:border-red-400/30 transition-all duration-200"
          >
            Wyczyść
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-surface border border-line rounded-2xl p-5 overflow-x-auto">
        <div
          className="grid select-none"
          style={{
            gridTemplateColumns: '56px repeat(7, 1fr)',
            gridTemplateRows: `auto repeat(${HOURS.length}, 1fr)`,
            gap: '2px',
          }}
          onMouseUp={handleMouseUp}
        >
          {/* Header: empty corner + day names */}
          <div />
          {DAYS_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[0.7rem] font-semibold text-subtle py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}

          {/* Rows: hour label + cells */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-[0.7rem] text-faint font-medium pr-2 flex items-center justify-end">
                {hourStr(hour)}
              </div>
              {Array.from({ length: 7 }, (_, day) => {
                const selected = isSelected(day, hour);
                return (
                  <div
                    key={`${day}-${hour}`}
                    onMouseDown={() => handleMouseDown(day, hour)}
                    onMouseEnter={() => handleMouseEnter(day, hour)}
                    className={`
                      h-9 rounded-lg cursor-pointer transition-all duration-150
                      ${selected
                        ? 'bg-accent/80 border border-accent/60 shadow-[0_0_12px_rgba(124,58,237,0.25)]'
                        : 'bg-surface-2 border border-line hover:bg-surface-3 hover:border-line-hi'
                      }
                    `}
                    title={`${DAYS[day]} ${hourStr(hour)} – ${hourStr(hour + 1)}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend + Save */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 text-[0.75rem] text-subtle">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-accent/80 border border-accent/60" />
            <span>Dostępny</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-surface-2 border border-line" />
            <span>Niedostępny</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-green-400 text-sm font-medium">{saveMsg}</span>}
          {saveError && <span className="text-red-400 text-sm font-medium">{saveError}</span>}
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-8 py-3 rounded-xl ${GRAD} text-white font-semibold text-sm cursor-pointer border-0 font-sans transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,58,237,0.35)] ${saving ? 'opacity-60' : ''}`}
          >
            {saving ? 'Zapisywanie...' : 'Zapisz harmonogram'}
          </button>
        </div>
      </div>

      {/* Day summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {DAYS.map((day, i) => {
          const hours = schedule.get(i);
          const count = hours?.size || 0;
          const sorted = hours ? [...hours].sort((a, b) => a - b) : [];
          // Group consecutive hours into ranges
          const ranges = [];
          if (sorted.length > 0) {
            let start = sorted[0];
            let end = sorted[0];
            for (let j = 1; j < sorted.length; j++) {
              if (sorted[j] === end + 1) {
                end = sorted[j];
              } else {
                ranges.push(`${hourStr(start)}–${hourStr(end + 1)}`);
                start = sorted[j];
                end = sorted[j];
              }
            }
            ranges.push(`${hourStr(start)}–${hourStr(end + 1)}`);
          }

          return (
            <div key={i} className={`rounded-xl p-3 border transition-all duration-200 ${count > 0 ? 'bg-accent/5 border-accent/20' : 'bg-surface border-line'}`}>
              <div className="text-[0.72rem] font-semibold text-subtle uppercase tracking-wider mb-1">{DAYS_SHORT[i]}</div>
              {count > 0 ? (
                <>
                  <div className="text-white text-sm font-bold">{count}h</div>
                  <div className="text-[0.68rem] text-subtle mt-0.5 leading-tight">
                    {ranges.join(', ')}
                  </div>
                </>
              ) : (
                <div className="text-faint text-xs">Wolne</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ─── Main TutorDashboard Component ───
export const TutorDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings]     = useState([]);
  const [slots, setSlots]           = useState([]);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('Przegląd');

  // Weekly schedule
  const [schedule, setSchedule]     = useState(new Map()); // Map<dayOfWeek, Set<hour>>
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedMsg, setSchedMsg]     = useState('');
  const [schedError, setSchedError] = useState('');

  // Slot management
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
      getMyWeeklySchedule().catch(() => ({ days: [] })),
    ]).then(([b, s, p, ws]) => {
      setBookings(b);
      setSlots(s);
      setProfile(p);
      if (p) { setBio(p.bio || ''); setPrice(p.price_per_hour || ''); setSubjects(p.subjects?.map(s => s.name) || []); }

      // Convert weekly schedule API response to Map<day, Set<hour>>
      const map = new Map();
      if (ws?.days) {
        for (const day of ws.days) {
          const hourSet = new Set();
          for (const slot of day.slots) {
            // Parse "HH:MM:SS" to hours
            const startH = parseInt(slot.start_time.split(':')[0], 10);
            const endH = parseInt(slot.end_time.split(':')[0], 10);
            for (let h = startH; h < endH; h++) {
              hourSet.add(h);
            }
          }
          map.set(day.day_of_week, hourSet);
        }
      }
      setSchedule(map);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  // ── Schedule save handler ──
  const handleSaveSchedule = async () => {
    setSchedMsg(''); setSchedError('');
    setSchedSaving(true);
    try {
      // Convert Map<day, Set<hour>> to API format
      // Group consecutive hours into time ranges per day
      const days = [];
      for (const [dayOfWeek, hourSet] of schedule) {
        if (hourSet.size === 0) continue;
        const sorted = [...hourSet].sort((a, b) => a - b);
        const slots = [];
        let start = sorted[0];
        let end = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] === end + 1) {
            end = sorted[i];
          } else {
            slots.push({ start_time: timeStr(start), end_time: timeStr(end + 1) });
            start = sorted[i];
            end = sorted[i];
          }
        }
        slots.push({ start_time: timeStr(start), end_time: timeStr(end + 1) });
        days.push({ day_of_week: dayOfWeek, slots });
      }

      await setWeeklySchedule(days);

      // Refresh slots from server
      const newSlots = await getMySlots().catch(() => []);
      setSlots(newSlots);

      setSchedMsg('Harmonogram zapisany! Sloty wygenerowane na 4 tygodnie.');
      setTimeout(() => setSchedMsg(''), 5000);
    } catch (e) {
      setSchedError(e.message || 'Nie udało się zapisać harmonogramu.');
      setTimeout(() => setSchedError(''), 5000);
    } finally { setSchedSaving(false); }
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
  const TABS = ['Przegląd', 'Harmonogram', 'Terminy', 'Profil'];

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-6xl mx-auto px-8 py-10 pb-20">

        {/* Greeting */}
        <div className="mb-9 animate-fade-up">
          <div className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent mb-2">Panel korepetytora</div>
          <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-black tracking-[-0.04em]">
            Cześć, {user?.name?.split(' ')[0]}
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
                { label: 'Nadchodzące lekcje', value: upcoming.length,     icon: '—' },
                { label: 'Wolne sloty',         value: futureSlots.length,  icon: '—' },
                { label: 'Łącznie lekcji',      value: bookings.length,     icon: '—' },
                { label: 'Cena / godz.',         value: profile ? `${profile.price_per_hour} zł` : '—', icon: '—' },
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
                      <div className="text-3xl mb-3"></div>
                      <p>Brak nadchodzących lekcji. Ustaw harmonogram, żeby uczniowie mogli rezerwować terminy.</p>
                      <button onClick={() => setTab('Harmonogram')} className="mt-3 text-accent cursor-pointer hover:underline bg-transparent border-0 font-sans">Ustaw harmonogram →</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {upcoming.map(b => {
                        const { date, time } = formatDt(b.start_time);
                        const { time: endTime } = formatDt(b.end_time);
                        const meetUrl = b.session?.meeting_url;
                        return (
                          <div key={b.id} className="bg-surface-2 rounded-xl border border-line overflow-hidden">
                            <div className="flex items-center justify-between p-4">
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
                            {meetUrl && (() => {
                              const startsIn = new Date(b.start_time) - new Date();
                              const minutesLeft = Math.ceil(startsIn / 60000);
                              const isLinkActive = minutesLeft <= 10;
                              return (
                                <div className="px-4 pb-4">
                                  {isLinkActive ? (
                                    <a
                                      href={meetUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg ${GRAD} text-white text-[0.78rem] font-semibold hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all duration-200 no-underline`}
                                    >
                                      Dołącz do spotkania
                                    </a>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-3 border border-line text-subtle text-[0.78rem] font-medium">
                                      Link dostępny za {minutesLeft - 10} min
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
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
                    Korepetytor
                  </span>
                </div>
                <div className="bg-surface border border-line rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-4">Szybkie akcje</h3>
                  <div className="flex flex-col gap-2.5">
                    <button onClick={() => setTab('Harmonogram')} className={`py-2.5 rounded-xl ${GRAD} text-white text-sm font-semibold cursor-pointer border-0 font-sans hover:-translate-y-0.5 transition-all duration-200`}>
                      Ustaw harmonogram →
                    </button>
                    <button onClick={() => setTab('Terminy')} className="py-2.5 rounded-xl border border-line-hi text-subtle text-sm font-medium cursor-pointer bg-transparent font-sans hover:text-white hover:border-white/20 transition-all duration-200">
                      Zobacz wygenerowane terminy
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

        {/* ── HARMONOGRAM (New Weekly Schedule Builder) ── */}
        {tab === 'Harmonogram' && (
          <WeeklyScheduleBuilder
            schedule={schedule}
            setSchedule={setSchedule}
            onSave={handleSaveSchedule}
            saving={schedSaving}
            saveMsg={schedMsg}
            saveError={schedError}
          />
        )}

        {/* ── TERMINY (Generated Slots) ── */}
        {tab === 'Terminy' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-[1.1rem]">Wygenerowane terminy ({futureSlots.length})</h2>
                <p className="text-[0.82rem] text-subtle mt-1">
                  Terminy generowane automatycznie z Twojego harmonogramu tygodniowego.
                </p>
              </div>
              <button
                onClick={() => setTab('Harmonogram')}
                className="px-4 py-2 rounded-xl border border-accent/30 text-accent text-sm font-semibold cursor-pointer bg-transparent font-sans hover:bg-accent/5 transition-all duration-200"
              >
                Edytuj harmonogram
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}</div>
            ) : slots.length === 0 ? (
              <div className="bg-surface border border-line rounded-2xl p-10 text-center text-subtle">
                <div className="text-3xl mb-3"></div>
                <p className="text-sm">Brak terminów. Ustaw harmonogram tygodniowy, aby automatycznie wygenerować sloty.</p>
                <button onClick={() => setTab('Harmonogram')} className="mt-3 text-accent cursor-pointer hover:underline bg-transparent border-0 font-sans">Ustaw harmonogram →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
