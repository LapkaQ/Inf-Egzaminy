import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTutorById, getTutorSlots, createBooking, getAllTutors } from '../../services/tutors';
import { useAuth } from '../../context/AuthContext';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';
const initials = (name = '') => name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

const DAYS_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const DAYS_SHORT = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
};
const formatTime = (iso) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
const formatDateShort = (d) => d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });

/** Group an array by a key function */
const groupBy = (arr, fn) => arr.reduce((acc, item) => {
  const key = fn(item);
  (acc[key] = acc[key] || []).push(item);
  return acc;
}, {});

/** Get the Monday of the week containing date */
const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Generate array of 7 dates starting from Monday */
const getWeekDays = (monday) => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(monday);
  d.setDate(d.getDate() + i);
  return d;
});

// ─── Confirmation Modal ───
const BookingModal = ({ slot, tutorName, price, onConfirm, onCancel, loading }) => {
  if (!slot) return null;
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);
  const duration = Math.round((end - start) / (1000 * 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      {/* Modal */}
      <div
        className="relative bg-surface border border-line rounded-2xl p-8 max-w-md w-full animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-bold">Potwierdź rezerwację</h3>
          <p className="text-subtle text-sm mt-1">Czy chcesz zarezerwować tę lekcję?</p>
        </div>

        <div className="bg-surface-2 border border-line rounded-xl p-5 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-subtle">Korepetytor</span>
            <span className="font-semibold">{tutorName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-subtle">Data</span>
            <span className="font-semibold capitalize">{formatDate(slot.start_time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-subtle">Godzina</span>
            <span className="font-semibold">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-subtle">Czas trwania</span>
            <span className="font-semibold">{duration} min</span>
          </div>
          <div className="border-t border-line my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-subtle">Cena</span>
            <span className={`font-black text-lg ${GRAD} bg-clip-text text-transparent`}>{price} zł</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-line-hi text-subtle text-sm font-medium cursor-pointer bg-transparent font-sans hover:text-white hover:border-white/20 transition-all duration-200"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl ${GRAD} text-white text-sm font-semibold cursor-pointer border-0 font-sans transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,58,237,0.4)] ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? 'Rezerwuję...' : 'Zarezerwuj →'}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Main Component ───
export const TutorDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [tutorUser, setTutorUser]     = useState(null);
  const [profile, setProfile]         = useState(null);
  const [slots, setSlots]             = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);

  // Booking state
  const [selectedSlot, setSelectedSlot] = useState(null); // slot object for modal
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookError, setBookError]     = useState('');
  const [bookSuccess, setBookSuccess] = useState('');

  // Week navigation
  const [weekOffset, setWeekOffset]   = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const prof = await getTutorById(parseInt(id)).catch(() => null);
        setProfile(prof);

        const allTutors = await getAllTutors().catch(() => []);
        const found = allTutors.find(t => t.id === parseInt(id));
        setTutorUser(found || null);

        if (prof) {
          const s = await getTutorSlots(prof.id).catch(() => []);
          setSlots(s);
        }
      } finally {
        setLoadingPage(false);
      }
    };
    load();
  }, [id]);

  const now = new Date();
  const futureSlots = useMemo(() => slots.filter(s => new Date(s.start_time) > now), [slots]);

  // Week navigation
  const currentMonday = getMonday(now);
  const baseMonday = new Date(currentMonday);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);

  // Group future slots by date string
  const slotsByDate = useMemo(() => {
    return groupBy(futureSlots, s => new Date(s.start_time).toDateString());
  }, [futureSlots]);

  // Check if any slots exist in the visible week
  const weekHasSlots = weekDays.some(d => (slotsByDate[d.toDateString()] || []).length > 0);

  // Find max week offset based on available slots
  const maxWeekOffset = useMemo(() => {
    if (futureSlots.length === 0) return 0;
    const lastSlot = new Date(Math.max(...futureSlots.map(s => new Date(s.start_time).getTime())));
    const lastMonday = getMonday(lastSlot);
    return Math.ceil((lastMonday - currentMonday) / (7 * 24 * 60 * 60 * 1000));
  }, [futureSlots]);

  const handleSlotClick = (slot) => {
    if (!isAuthenticated) return;
    setBookError('');
    setBookSuccess('');
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setBookError('');
    try {
      await createBooking(selectedSlot.id);
      setBookSuccess('Rezerwacja udana! Sprawdź swój dashboard.');
      setSlots(prev => prev.filter(s => s.id !== selectedSlot.id));
      setSelectedSlot(null);
      setTimeout(() => setBookSuccess(''), 6000);
    } catch (e) {
      setBookError(e.message || 'Nie udało się zarezerwować. Spróbuj ponownie.');
      setSelectedSlot(null);
    } finally {
      setBookingLoading(false);
    }
  };


  if (loadingPage) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-subtle">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p>Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-bold mb-2">Brak profilu korepetytora</h2>
          <p className="text-subtle mb-6">Ten użytkownik nie stworzył jeszcze profilu korepetytora.</p>
          <Link to="/tutors" className="text-accent hover:underline">← Wróć do listy</Link>
        </div>
      </div>
    );
  }

  const subjects = profile.subjects || [];
  const subjectDisplay = subjects.map(s => s.name === 'INF03' ? 'INF.03' : 'INF.04').join(' & ');
  const tutorName = tutorUser?.name || `Korepetytor #${profile.user_id}`;

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-6xl mx-auto px-8">
        {/* Back */}
        <div className="pt-8 pb-2">
          <Link to="/tutors" className="inline-flex items-center gap-1.5 text-subtle text-sm hover:text-white transition-colors">
            ← Powrót do korepetytorów
          </Link>
        </div>

        <section className="py-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

            {/* ── Left ── */}
            <div className="animate-fade-up">
              {/* Header */}
              <div className="flex items-center gap-5 mb-6">
                <div className={`w-[88px] h-[88px] rounded-full ${GRAD} flex items-center justify-center text-white text-[1.8rem] font-black shrink-0 border-2 border-accent/30`}>
                  {initials(tutorName)}
                </div>
                <div>
                  <h1 className="text-[2rem] font-black tracking-[-0.04em] mb-1">{tutorName}</h1>
                  <div className="text-[0.85rem] text-accent font-semibold mb-2">{subjectDisplay || 'Korepetytor INF'}</div>
                  <div className="flex gap-4 text-sm text-subtle">
                    <span>⭐ {profile.rating_avg ?? '—'} / 5</span>
                    <span>💬 Odpowiada w ciągu 2h</span>
                  </div>
                </div>
              </div>

              {/* Subject badges */}
              <div className="flex gap-2 mb-7">
                {subjects.length > 0 ? subjects.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-xs font-semibold text-violet-300 tracking-wider">
                    {s.name === 'INF03' ? 'INF.03' : 'INF.04'}
                  </span>
                )) : (
                  <span className="text-subtle text-sm">Brak przypisanych kwalifikacji.</span>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="bg-surface border border-line rounded-2xl p-7 mb-5">
                  <h3 className="font-bold text-[0.95rem] mb-3">O mnie</h3>
                  <p className="text-subtle text-sm leading-[1.8]">{profile.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Ocena', value: `${profile.rating_avg ?? '—'}★` },
                  { label: 'Wolnych terminów', value: futureSlots.length },
                  { label: 'Cena / godz.', value: `${profile.price_per_hour} zł` },
                ].map(s => (
                  <div key={s.label} className="bg-surface border border-line rounded-xl p-5 text-center">
                    <div className={`text-[1.5rem] font-black tracking-[-0.04em] ${GRAD} bg-clip-text text-transparent`}>{s.value}</div>
                    <div className="text-[0.78rem] text-subtle mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Calendar View ── */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[1.15rem] font-black tracking-[-0.03em]">Wybierz termin</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                      disabled={weekOffset === 0}
                      className="w-9 h-9 rounded-lg border border-line bg-surface-2 text-subtle text-sm cursor-pointer font-sans hover:text-white hover:border-line-hi transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      ‹
                    </button>
                    <span className="text-sm text-subtle font-medium min-w-[140px] text-center">
                      {formatDateShort(weekDays[0])} – {formatDateShort(weekDays[6])}
                    </span>
                    <button
                      onClick={() => setWeekOffset(Math.min(maxWeekOffset, weekOffset + 1))}
                      disabled={weekOffset >= maxWeekOffset}
                      className="w-9 h-9 rounded-lg border border-line bg-surface-2 text-subtle text-sm cursor-pointer font-sans hover:text-white hover:border-line-hi transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {bookSuccess && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-sm flex items-center gap-2">
                    <span>✅</span> {bookSuccess}
                  </div>
                )}
                {bookError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <span>❌</span> {bookError}
                  </div>
                )}

                {/* Week Calendar Grid */}
                <div className="bg-surface border border-line rounded-2xl overflow-hidden">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 border-b border-line">
                    {weekDays.map((day, i) => {
                      const isToday = day.toDateString() === now.toDateString();
                      const isPast = day < now && !isToday;
                      const daySlots = slotsByDate[day.toDateString()] || [];
                      return (
                        <div key={i} className={`text-center py-3 ${i < 6 ? 'border-r border-line' : ''} ${isPast ? 'opacity-40' : ''}`}>
                          <div className="text-[0.68rem] font-semibold text-subtle uppercase tracking-wider">{DAYS_SHORT[day.getDay()]}</div>
                          <div className={`text-sm font-bold mt-0.5 ${isToday ? 'text-accent' : 'text-white'}`}>
                            {day.getDate()}
                          </div>
                          {daySlots.length > 0 && (
                            <div className="flex justify-center mt-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Slot rows */}
                  <div className="grid grid-cols-7 min-h-[200px]">
                    {weekDays.map((day, i) => {
                      const isPast = day < now && day.toDateString() !== now.toDateString();
                      const daySlots = (slotsByDate[day.toDateString()] || [])
                        .filter(s => new Date(s.start_time) > now)
                        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

                      return (
                        <div key={i} className={`flex flex-col gap-1.5 p-2 ${i < 6 ? 'border-r border-line' : ''} ${isPast ? 'opacity-30 pointer-events-none' : ''}`}>
                          {daySlots.length > 0 ? daySlots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotClick(slot)}
                              disabled={!isAuthenticated}
                              className={`
                                group relative py-2 px-1 rounded-lg text-center transition-all duration-200 font-sans cursor-pointer border
                                ${isAuthenticated
                                  ? 'bg-accent/10 border-accent/20 hover:bg-accent/25 hover:border-accent/40 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.25)]'
                                  : 'bg-surface-2 border-line cursor-not-allowed'
                                }
                              `}
                            >
                              <div className="text-[0.72rem] font-bold text-white">{formatTime(slot.start_time)}</div>
                              <div className="text-[0.62rem] text-subtle">{formatTime(slot.end_time)}</div>
                            </button>
                          )) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-[0.68rem] text-faint">—</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="mt-4 p-4 bg-surface border border-line rounded-xl text-center">
                    <p className="text-sm text-subtle mb-2">
                      Musisz się zalogować, aby zarezerwować termin.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Link to="/login" className="text-accent text-sm font-semibold hover:underline">Zaloguj się</Link>
                      <span className="text-faint">·</span>
                      <Link to="/register" className="text-accent text-sm font-semibold hover:underline">Zarejestruj się</Link>
                    </div>
                  </div>
                )}

                {futureSlots.length === 0 && (
                  <div className="mt-4 bg-surface border border-line rounded-2xl p-8 text-center text-subtle">
                    <div className="text-3xl mb-3">📅</div>
                    <p className="text-sm">Brak dostępnych terminów. Sprawdź ponownie wkrótce.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Booking summary card (sticky) ── */}
            <div className="sticky top-[90px] animate-fade-up [animation-delay:0.15s]">
              <div className="bg-surface border border-line rounded-2xl p-8">
                <div className="text-[1.8rem] font-black tracking-[-0.04em] mb-1">
                  {profile.price_per_hour} zł
                  <span className="text-[0.9rem] text-subtle font-normal"> / godz.</span>
                </div>
                <p className="text-[0.82rem] text-subtle mb-6">Wybierz godzinę z kalendarza, aby zarezerwować</p>

                <div className="space-y-2.5 mb-6 text-[0.83rem] text-subtle">
                  <div>✅ Weryfikowany korepetytor</div>
                  <div>📅 {futureSlots.length} dostępnych terminów</div>
                  <div>💬 Kontakt 7 dni w tygodniu</div>
                  <div>📊 Raporty postępów po lekcji</div>
                </div>

                {isAuthenticated ? (
                  <>
                    <div className="p-3 bg-surface-2 rounded-xl border border-line text-center text-[0.78rem] text-subtle mb-3">
                      Zalogowany jako: <strong className="text-white">{user?.name}</strong>
                    </div>
                    <div className="p-3 bg-accent/5 rounded-xl border border-accent/15 text-center text-[0.75rem] text-violet-300">
                      ← Kliknij godzinę w kalendarzu, aby zarezerwować
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/register" className={`block w-full py-3.5 text-center rounded-xl ${GRAD} text-white font-semibold text-sm mb-3 hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] transition-all duration-200`}>
                      Zarejestruj się →
                    </Link>
                    <Link to="/login" className="block w-full py-3.5 rounded-xl border border-line-hi text-subtle text-sm font-medium text-center hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200">
                      Mam już konto
                    </Link>
                  </>
                )}

                <p className="mt-4 text-[0.73rem] text-faint text-center">⚡ Odpowiada średnio w ciągu 2 godzin</p>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* Booking Confirmation Modal */}
      <BookingModal
        slot={selectedSlot}
        tutorName={tutorName}
        price={profile.price_per_hour}
        onConfirm={handleConfirmBooking}
        onCancel={() => setSelectedSlot(null)}
        loading={bookingLoading}
      />
    </div>
  );
};

export default TutorDetails;
