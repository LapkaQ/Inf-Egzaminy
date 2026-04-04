import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, cancelBooking } from '../../services/tutors';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';

const statusLabel = (s) => ({ pending: 'Oczekuje', confirmed: 'Potwierdzone', cancelled: 'Anulowane', completed: 'Zakończone' }[s] || s);
const statusColor = (s) => ({ pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25', confirmed: 'text-green-400 bg-green-400/10 border-green-400/25', cancelled: 'text-red-400 bg-red-400/10 border-red-400/25', completed: 'text-subtle bg-surface-2 border-line' }[s] || 'text-subtle');

const formatDt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      const updated = await cancelBooking(id);
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    } catch {}
    finally { setCancelling(null); }
  };

  const upcoming  = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.start_time) > new Date());
  const past      = bookings.filter(b => b.status === 'completed' || new Date(b.start_time) <= new Date());
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-6xl mx-auto px-8 py-10 pb-20">

        {/* Greeting */}
        <div className="mb-9 animate-fade-up">
          <div className="text-[0.72rem] font-semibold tracking-[0.12em] uppercase text-accent mb-2">Panel ucznia</div>
          <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-black tracking-[-0.04em]">
            Cześć, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-subtle text-sm mt-1.5">
            Masz <strong className="text-white">{upcoming.length}</strong> nadchodzących lekcji.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-up [animation-delay:0.1s]">
          {[
            { label: 'Nadchodzące', value: upcoming.length,  icon: '📅' },
            { label: 'Zakończone',  value: past.length,      icon: '✅' },
            { label: 'Anulowane',  value: cancelled.length,  icon: '❌' },
            { label: 'Łącznie',    value: bookings.length,   icon: '📚' },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-line rounded-2xl p-5">
              <div className="text-xl mb-2">{s.icon}</div>
              <div className="text-[0.78rem] text-subtle font-medium mb-1.5">{s.label}</div>
              <div className={`text-[1.8rem] font-black tracking-[-0.04em] ${GRAD} bg-clip-text text-transparent`}>{loading ? '—' : s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main */}
          <div className="flex flex-col gap-6">

            {/* Upcoming bookings */}
            <div className="bg-surface border border-line rounded-2xl p-7 animate-fade-up [animation-delay:0.2s]">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-[1rem]">Nadchodzące lekcje</h2>
                <Link to="/tutors" className="text-[0.78rem] text-accent font-semibold hover:text-violet-300 transition-colors">
                  Zarezerwuj nową →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-10 text-subtle text-sm">
                  <div className="text-3xl mb-3">📅</div>
                  <p>Brak nadchodzących lekcji.</p>
                  <Link to="/tutors" className="mt-2 inline-block text-accent hover:underline">Zarezerwuj teraz →</Link>
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
                            T{b.tutor_id}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">Lekcja z korepetytorem #{b.tutor_id}</div>
                            <div className="text-[0.74rem] text-subtle">{date} · {time} – {endTime}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full border text-[0.7rem] font-semibold ${statusColor(b.status)}`}>
                            {statusLabel(b.status)}
                          </span>
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="text-[0.75rem] text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-transparent border-0 font-sans disabled:opacity-50"
                            >
                              {cancelling === b.id ? '...' : 'Anuluj'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            {!loading && past.length > 0 && (
              <div className="bg-surface border border-line rounded-2xl p-7 animate-fade-up [animation-delay:0.3s]">
                <h2 className="font-bold text-[1rem] mb-5">Historia lekcji</h2>
                <div className="divide-y divide-line">
                  {past.slice(0, 5).map(b => {
                    const { date, time } = formatDt(b.start_time);
                    return (
                      <div key={b.id} className="flex items-center justify-between py-3.5">
                        <div>
                          <div className="text-sm font-medium">Lekcja z korepetytorem #{b.tutor_id}</div>
                          <div className="text-[0.73rem] text-faint mt-0.5">{date} o {time}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full border text-[0.7rem] font-semibold ${statusColor(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Profile */}
            <div className="bg-surface border border-line rounded-2xl p-6 text-center animate-fade-up [animation-delay:0.15s]">
              <div className={`w-16 h-16 rounded-full ${GRAD} flex items-center justify-center text-white text-xl font-black mx-auto mb-3 border-2 border-accent/25`}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="font-bold mb-0.5">{user?.name}</div>
              <div className="text-[0.8rem] text-subtle mb-3">{user?.email}</div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent/10 border border-accent/25 rounded-full text-xs font-semibold text-violet-300">
                👤 Uczeń
              </span>
            </div>

            {/* Quick actions */}
            <div className="bg-surface border border-line rounded-2xl p-6 animate-fade-up [animation-delay:0.25s]">
              <h3 className="font-bold text-sm mb-4">Szybkie akcje</h3>
              <div className="flex flex-col gap-2.5">
                <Link to="/tutors" className={`block text-center py-2.5 rounded-xl ${GRAD} text-white text-sm font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(124,58,237,0.4)] transition-all duration-200`}>
                  Znajdź korepetytora →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
