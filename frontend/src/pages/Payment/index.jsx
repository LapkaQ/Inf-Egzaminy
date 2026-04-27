import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings } from '../../services/tutors';
import { emulatePayment, getPaymentStatus, initiatePayment } from '../../services/payments';
import { APP_NAME } from '../../config';

const GRAD = 'bg-gradient-to-br from-accent to-accent-2';

const formatDt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const PaymentPage = () => {
  const { bookingId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Pobierz booking
        const bookings = await getMyBookings();
        const found = bookings.find(b => b.id === parseInt(bookingId));
        if (found) setBooking(found);

        // Inicjuj płatność (lub pobierz istniejącą)
        const initiated = await initiatePayment(parseInt(bookingId));
        setPaymentInfo(initiated);
      } catch (e) {
        console.error('Payment load error:', e);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) load();
  }, [bookingId, isAuthenticated]);

  const handlePay = async () => {
    setPaying(true);
    setPayError('');
    try {
      await emulatePayment(parseInt(bookingId));
      setPaySuccess(true);

      // Po 3s redirect do dashboardu
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (e) {
      setPayError(e.message || 'Płatność nie powiodła się. Spróbuj ponownie.');
    } finally {
      setPaying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-xl font-bold mb-2">Musisz się zalogować</h2>
          <p className="text-subtle mb-6">Zaloguj się, aby opłacić lekcję.</p>
          <Link to="/login" className="text-accent hover:underline">Zaloguj się →</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-subtle">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p>Ładowanie płatności...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-xl font-bold mb-2">Nie znaleziono rezerwacji</h2>
          <p className="text-subtle mb-6">Ta rezerwacja nie istnieje lub nie masz do niej dostępu.</p>
          <Link to="/dashboard" className="text-accent hover:underline">← Powrót do panelu</Link>
        </div>
      </div>
    );
  }

  const { date: lessonDate, time: startTime } = formatDt(booking.start_time);
  const { time: endTime } = formatDt(booking.end_time);
  const duration = Math.round((new Date(booking.end_time) - new Date(booking.start_time)) / (1000 * 60));
  const amount = paymentInfo?.amount || booking.payment?.amount || 0;
  const isAlreadyPaid = booking.status === 'confirmed' || booking.payment?.status === 'completed';

  if (paySuccess || isAlreadyPaid) {
    return (
      <div className="min-h-screen bg-page text-white pt-[90px] flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6">
          <div className="bg-surface border border-line rounded-2xl p-10 text-center animate-scale-in">
            {/* Animated check */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className={`w-full h-full rounded-full ${GRAD} flex items-center justify-center`}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" 
                    style={{
                      strokeDasharray: 24,
                      strokeDashoffset: 0,
                      animation: 'draw-check 0.5s ease-out 0.3s both',
                    }}
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" 
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }} 
              />
            </div>

            <h2 className="text-[1.5rem] font-black mb-2">Płatność udana!</h2>
            <p className="text-subtle text-sm mb-6">
              Twoja lekcja została opłacona. Sprawdź szczegóły w panelu.
            </p>

            <div className="bg-surface-2 border border-line rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Kwota</span>
                <span className={`font-black ${GRAD} bg-clip-text text-transparent`}>{amount} zł</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Status</span>
                <span className="text-green-400 font-semibold">Opłacone</span>
              </div>
            </div>

            <Link
              to="/dashboard"
              className={`inline-block w-full py-3.5 rounded-xl ${GRAD} text-white font-semibold text-sm text-center hover:-translate-y-0.5 hover:shadow-[0_10px_35px_rgba(124,58,237,0.45)] transition-all duration-200 no-underline`}
            >
              Przejdź do panelu →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-white pt-[90px]">
      <div className="max-w-lg mx-auto px-6 py-10 pb-20">

        {/* Back */}
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-subtle text-sm hover:text-white transition-colors">
            ← Powrót do panelu
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">

          <h1 className="text-[clamp(1.4rem,4vw,1.8rem)] font-black tracking-[-0.04em] mb-2">
            Opłać lekcję
          </h1>
          <p className="text-subtle text-sm">
            Aby potwierdzić rezerwację, dokonaj płatności.
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-surface border border-line rounded-2xl overflow-hidden animate-fade-up [animation-delay:0.1s]">
          
          {/* Gradient header */}
          <div className={`${GRAD} px-6 py-5`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold">
                {APP_NAME.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-white/90">{APP_NAME}</div>
                <div className="text-xs text-white/60">Platforma korepetycji</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Data lekcji</span>
                <span className="font-semibold capitalize">{lessonDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Godziny</span>
                <span className="font-semibold">{startTime} – {endTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Czas trwania</span>
                <span className="font-semibold">{duration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Korepetytor</span>
                <span className="font-semibold">{booking.tutor?.name || `T${booking.tutor_id}`}</span>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <div className="flex justify-between items-center">
                <span className="text-subtle font-medium">Do zapłaty</span>
                <span className={`text-[1.8rem] font-black tracking-[-0.04em] ${GRAD} bg-clip-text text-transparent`}>
                  {amount} zł
                </span>
              </div>
            </div>

            {/* Payment method section */}
            <div className="bg-surface-2 border border-line rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400 text-sm font-bold">
                  H
                </div>
                <div>
                  <div className="text-sm font-semibold">HotPay.pl</div>
                  <div className="text-xs text-subtle">Bramka płatności</div>
                </div>
                <div className="ml-auto px-2 py-0.5 bg-amber-400/10 border border-amber-400/25 rounded-full text-[0.65rem] font-semibold text-amber-400">
                  EMULACJA
                </div>
              </div>
              <p className="text-[0.72rem] text-faint leading-relaxed">
                Aktualnie działa emulacja bramki płatności. Po integracji z HotPay, płatność będzie przetwarzana przez ich system.
              </p>
            </div>

            {/* Error */}
            {payError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm flex items-center gap-2">
                ❌ {payError}
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={paying}
              id="emulate-pay-button"
              className={`w-full py-4 rounded-xl ${GRAD} text-white font-bold text-[0.95rem] cursor-pointer border-0 font-sans transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(124,58,237,0.5)] active:translate-y-0 ${paying ? 'opacity-60 cursor-wait' : ''}`}
            >
              {paying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Przetwarzanie...
                </span>
              ) : (
                `Opłać ${amount} zł →`
              )}
            </button>

            {/* Security info */}
            <div className="flex items-center justify-center gap-2 text-[0.72rem] text-faint">
              <span>Płatność jest szyfrowana i bezpieczna</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-[0.72rem] text-faint leading-relaxed">
          Jeśli nie opłacisz lekcji przed jej rozpoczęciem,<br/>
          rezerwacja zostanie automatycznie anulowana.
        </div>
      </div>

      {/* Inline keyframe for check animation */}
      <style>{`
        @keyframes draw-check {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
