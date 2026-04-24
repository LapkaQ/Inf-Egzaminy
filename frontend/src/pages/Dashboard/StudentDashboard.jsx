import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings, cancelBooking } from '../../services/tutors';
import { generateMeeting } from '../../services/meetings';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';

const statusLabel = (s) => ({
  pending: 'Oczekuje',
  awaiting_payment: 'Nieopłacone',
  confirmed: 'Potwierdzone',
  cancelled: 'Anulowane',
  completed: 'Zakończone',
}[s] || s);

const statusColor = (s) => ({
  pending: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  awaiting_payment: 'text-orange-400 bg-orange-400/10 border-orange-400/25',
  confirmed: 'text-green-400 bg-green-400/10 border-green-400/25',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/25',
  completed: 'text-subtle bg-surface-2 border-line',
}[s] || 'text-subtle');

const paymentStatusLabel = (s) => ({
  pending: 'Do opłacenia',
  completed: 'Opłacone',
  failed: 'Błąd płatności',
  refunded: 'Zwrócone',
}[s] || '—');

const paymentStatusColor = (s) => ({
  pending: 'text-orange-400',
  completed: 'text-green-400',
  failed: 'text-red-400',
  refunded: 'text-blue-400',
}[s] || 'text-subtle');

const formatDt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }),
    time: d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [regenerating, setRegenerating] = useState(null);

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

  const handleRegenerate = async (id) => {
    setRegenerating(id);
    try {
      const result = await generateMeeting(id);
      // Odśwież bookings po wygenerowaniu nowego linku
      const refreshed = await getMyBookings();
      setBookings(refreshed);
    } catch {}
    finally { setRegenerating(null); }
  };

  const upcoming  = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.start_time) > new Date());
  const past      = bookings.filter(b => (b.status === 'completed' || new Date(b.start_time) <= new Date()) && b.status !== 'cancelled');

  // Osobna lista nieopłaconych
  const unpaid = upcoming.filter(b => b.status === 'awaiting_payment');
  const paidUpcoming = upcoming.filter(b => b.status !== 'awaiting_payment');

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-3xl mx-auto px-8 py-10 pb-20">

        {/* Greeting */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-[clamp(1.6rem,4vw,2.2rem)] font-black tracking-[-0.04em]">
            Cześć, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-subtle text-sm mt-1.5">
            {upcoming.length > 0
              ? <>Masz <strong className="text-white">{upcoming.length}</strong> nadchodzących {upcoming.length === 1 ? 'lekcję' : 'lekcji'}.{unpaid.length > 0 && <> <span className="text-orange-400">({unpaid.length} do opłacenia)</span></>}</>
              : 'Nie masz zaplanowanych lekcji.'
            }
          </p>
        </div>

        {/* Unpaid bookings alert */}
        {unpaid.length > 0 && (
          <div className="mb-6 animate-fade-up [animation-delay:0.05s]">
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">

                <h3 className="font-bold text-[0.95rem] text-orange-400">Lekcje do opłacenia</h3>
              </div>
              <div className="flex flex-col gap-2">
                {unpaid.map(b => {
                  const { date, time } = formatDt(b.start_time);
                  const { time: endTime } = formatDt(b.end_time);
                  const amount = b.payment?.amount;
                  return (
                    <div key={b.id} className="flex items-center justify-between bg-surface/80 border border-line rounded-xl px-4 py-3">
                      <div>
                        <div className="font-semibold text-sm capitalize">{date}</div>
                        <div className="text-[0.74rem] text-subtle">{time} – {endTime}{amount ? <> · <span className="text-orange-400 font-semibold">{amount} zł</span></> : ''}</div>
                      </div>
                      <button
                        onClick={() => navigate(`/payment/${b.id}`)}
                        className={`px-5 py-2 rounded-xl ${GRAD} text-white text-[0.78rem] font-semibold cursor-pointer border-0 font-sans hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all duration-200`}
                      >
                        Opłać →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming bookings */}
        <div className="mb-8 animate-fade-up [animation-delay:0.1s]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-[1rem]">Nadchodzące lekcje</h2>
            <Link to="/tutors" className="text-[0.78rem] text-accent font-semibold hover:text-violet-300 transition-colors">
              Zarezerwuj nową →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-[72px] bg-surface rounded-xl animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-8 text-center">
              <p className="text-subtle text-sm mb-3">Brak nadchodzących lekcji.</p>
              <Link to="/tutors" className={`inline-block px-6 py-2.5 rounded-xl ${GRAD} text-white text-sm font-semibold hover:-translate-y-0.5 transition-all duration-200`}>
                Znajdź korepetytora →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcoming.map(b => {
                const { date, time } = formatDt(b.start_time);
                const { time: endTime } = formatDt(b.end_time);
                const meetUrl = b.session?.meeting_url;
                const isAwaitingPayment = b.status === 'awaiting_payment';

                return (
                  <div key={b.id} className={`bg-surface border rounded-xl hover:border-line-hi transition-colors overflow-hidden ${isAwaitingPayment ? 'border-orange-500/25' : 'border-line'}`}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-lg ${isAwaitingPayment ? 'bg-orange-500/20 text-orange-400' : GRAD + ' text-white'} flex items-center justify-center text-xs font-bold shrink-0`}>
                          {isAwaitingPayment ? '$' : '#'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm capitalize">{date}</div>
                          <div className="text-[0.74rem] text-subtle">
                            {time} – {endTime}
                            {b.payment && (
                              <span className={`ml-2 ${paymentStatusColor(b.payment.status)}`}>
                                · {paymentStatusLabel(b.payment.status)}
                                {b.payment.amount && ` (${b.payment.amount} zł)`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full border text-[0.7rem] font-semibold ${statusColor(b.status)}`}>
                          {statusLabel(b.status)}
                        </span>
                        {isAwaitingPayment && (
                          <button
                            onClick={() => navigate(`/payment/${b.id}`)}
                            className={`px-3 py-1.5 rounded-lg ${GRAD} text-white text-[0.72rem] font-semibold cursor-pointer border-0 font-sans hover:-translate-y-0.5 transition-all duration-200`}
                          >
                            Opłać
                          </button>
                        )}
                        {b.status !== 'cancelled' && b.status !== 'confirmed' && (
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
                    {/* Meeting link - only for confirmed (paid) bookings */}
                    {meetUrl && !isAwaitingPayment && (() => {
                      const startsIn = new Date(b.start_time) - new Date();
                      const minutesLeft = Math.ceil(startsIn / 60000);
                      const isLinkActive = minutesLeft <= 10;
                      const isZoomLink = meetUrl.includes('zoom.us');
                      return (
                        <div className="px-4 pb-4 flex flex-col gap-2">
                          {isLinkActive ? (
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg ${GRAD} text-white text-[0.78rem] font-semibold hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(124,58,237,0.35)] transition-all duration-200 no-underline`}
                            >
                              {isZoomLink ? 'Dołącz do spotkania Zoom' : 'Dołącz do spotkania'}
                            </a>
                          ) : (
                            <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-2 border border-line text-subtle text-[0.78rem] font-medium">
                              Link dostępny za {minutesLeft - 10} min
                            </div>
                          )}

                        </div>
                      );
                    })()}
                    {/* Payment prompt for unpaid */}
                    {isAwaitingPayment && (
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => navigate(`/payment/${b.id}`)}
                          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[0.78rem] font-semibold hover:bg-orange-500/30 transition-all duration-200 cursor-pointer`}
                        >
                          Przejdź do płatności
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Past bookings */}
        {!loading && past.length > 0 && (
          <div className="animate-fade-up [animation-delay:0.2s]">
            <h2 className="font-bold text-[1rem] mb-4">Historia lekcji</h2>
            <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden">
              {past.slice(0, 8).map(b => {
                const { date, time } = formatDt(b.start_time);
                return (
                  <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <div className="text-sm font-medium capitalize">{date}</div>
                      <div className="text-[0.73rem] text-faint mt-0.5">{time}</div>
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
    </div>
  );
};

export default StudentDashboard;
