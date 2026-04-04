import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTutorById, getTutorSlots, createBooking, getAllTutors } from '../../services/tutors';
import { useAuth } from '../../context/AuthContext';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';
const initials = (name = '') => name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2);

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
};
const formatTime = (iso) => new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

export const TutorDetails = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [tutorUser, setTutorUser]     = useState(null);  // UserResponse (name, email)
  const [profile, setProfile]         = useState(null);  // TutorProfileResponse
  const [slots, setSlots]             = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [bookingId, setBookingId]     = useState(null);
  const [bookError, setBookError]     = useState('');
  const [bookSuccess, setBookSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Fetch profile (TutorProfileResponse) by user_id
        const prof = await getTutorById(parseInt(id)).catch(() => null);
        setProfile(prof);

        // 2. Fetch tutor's user info (name, email) from the full list
        const allTutors = await getAllTutors().catch(() => []);
        const found = allTutors.find(t => t.id === parseInt(id));
        setTutorUser(found || null);

        // 3. If profile exists, fetch slots (by profile.id NOT user_id)
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


  const handleBook = async (slotId) => {
    if (!isAuthenticated) return;
    setBookingId(slotId);
    setBookError('');
    setBookSuccess('');
    try {
      await createBooking(slotId);
      setBookedIds(prev => new Set([...prev, slotId]));
      setBookSuccess('Rezerwacja udana! Sprawdź dashboard po potwierdzenie.');
      // Remove booked slot from visible list
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (e) {
      setBookError(e.message || 'Nie udało się zarezerwować. Spróbuj ponownie.');
    } finally {
      setBookingId(null);
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

  const userId = profile.user_id;
  const subjects = profile.subjects || [];
  const subjectDisplay = subjects.map(s => s.name === 'INF03' ? 'INF.03' : 'INF.04').join(' & ');

  // Group slots by day
  const slotsByDay = slots.reduce((acc, slot) => {
    const day = new Date(slot.start_time).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  const now = new Date();
  const futureSlots = slots.filter(s => new Date(s.start_time) > now);

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
                  {initials(tutorUser?.name || `T${profile.user_id}`)}
                </div>
                <div>
                  <h1 className="text-[2rem] font-black tracking-[-0.04em] mb-1">
                    {tutorUser?.name || `Korepetytor #${profile.user_id}`}
                  </h1>
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
                  { label: 'Wolnych slotów', value: futureSlots.length },
                  { label: 'Cena / godz.', value: `${profile.price_per_hour} zł` },
                ].map(s => (
                  <div key={s.label} className="bg-surface border border-line rounded-xl p-5 text-center">
                    <div className={`text-[1.5rem] font-black tracking-[-0.04em] ${GRAD} bg-clip-text text-transparent`}>{s.value}</div>
                    <div className="text-[0.78rem] text-subtle mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Availability slots ── */}
              <div>
                <h2 className="text-[1.15rem] font-black tracking-[-0.03em] mb-5">Dostępne terminy</h2>

                {bookSuccess && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-sm">{bookSuccess}</div>
                )}
                {bookError && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm">{bookError}</div>
                )}

                {futureSlots.length === 0 ? (
                  <div className="bg-surface border border-line rounded-2xl p-8 text-center text-subtle">
                    <div className="text-3xl mb-3">📅</div>
                    <p className="text-sm">Brak dostępnych terminów. Sprawdź ponownie wkrótce.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {Object.entries(slotsByDay).map(([day, daySlots]) => {
                      const futureDaySlots = daySlots.filter(s => new Date(s.start_time) > now);
                      if (!futureDaySlots.length) return null;
                      return (
                        <div key={day} className="bg-surface border border-line rounded-2xl overflow-hidden">
                          <div className="px-6 py-3 bg-surface-2 border-b border-line">
                            <span className="text-[0.82rem] font-semibold capitalize">{formatDate(futureDaySlots[0].start_time)}</span>
                          </div>
                          <div className="p-4 flex flex-wrap gap-3">
                            {futureDaySlots.map(slot => {
                              const isBooking = bookingId === slot.id;
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => handleBook(slot.id)}
                                  disabled={!isAuthenticated || isBooking}
                                  className={`flex flex-col items-center px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 font-sans cursor-pointer ${
                                    isAuthenticated
                                      ? `${GRAD} border-transparent text-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(124,58,237,0.4)]`
                                      : 'bg-surface-2 border-line text-subtle cursor-not-allowed'
                                  } ${isBooking ? 'opacity-60' : ''}`}
                                >
                                  <span className="font-bold">{formatTime(slot.start_time)}</span>
                                  <span className="text-[0.7rem] opacity-75">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
                                  {isBooking && <span className="text-[0.7rem] mt-1">Rezerwuję...</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isAuthenticated && (
                  <p className="mt-4 text-sm text-subtle text-center">
                    <Link to="/login" className="text-accent hover:underline">Zaloguj się</Link>, żeby zarezerwować termin.
                  </p>
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
                <p className="text-[0.82rem] text-subtle mb-6">Zarezerwuj bezpośrednio z kalendarza powyżej</p>

                <div className="space-y-2.5 mb-6 text-[0.83rem] text-subtle">
                  <div>✅ Weryfikowany korepetytor</div>
                  <div>📅 {futureSlots.length} dostępnych terminów</div>
                  <div>💬 Kontakt 7 dni w tygodniu</div>
                  <div>📊 Raporty postępów po lekcji</div>
                </div>

                {isAuthenticated ? (
                  <div className="p-3 bg-surface-2 rounded-xl border border-line text-center text-[0.78rem] text-subtle">
                    Zalogowany jako: <strong className="text-white">{user?.name}</strong>
                  </div>
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
    </div>
  );
};

export default TutorDetails;
