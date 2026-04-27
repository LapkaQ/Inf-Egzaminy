from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta
import uuid
import logging

from models.payment import Payment, PaymentStatus
from models.booking import Booking, BookingStatus
from models.tutor import TutorProfile
from core.config import settings

logger = logging.getLogger(__name__)

# ── Czas graniczny: lekcje bliżej niż 24h wymagają natychmiastowej płatności ──
IMMEDIATE_PAYMENT_THRESHOLD_HOURS = 24


def _calculate_amount(db: Session, booking: Booking) -> int:
    """Oblicza kwotę na podstawie price_per_hour tutora i czasu trwania lekcji."""
    tutor_profile = db.query(TutorProfile).filter(TutorProfile.user_id == booking.tutor_id).first()
    if not tutor_profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nie znaleziono profilu korepetytora")

    duration_hours = (booking.end_time - booking.start_time).total_seconds() / 3600
    amount = int(tutor_profile.price_per_hour * duration_hours)
    return amount


def requires_immediate_payment(booking: Booking) -> bool:
    """Sprawdza czy lekcja odbywa się w ciągu 24h — wtedy płatność od razu."""
    time_until_lesson = booking.start_time - datetime.utcnow()
    return time_until_lesson < timedelta(hours=IMMEDIATE_PAYMENT_THRESHOLD_HOURS)


def initiate_payment(db: Session, booking_id: int, current_user_id: int) -> dict:
    """Tworzy rekord Payment i zwraca URL (emulacja lub HotPay)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie znaleziona")

    if booking.student_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="To nie Twoja rezerwacja")

    if booking.status == BookingStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rezerwacja jest anulowana")

    if booking.status == BookingStatus.confirmed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rezerwacja jest już opłacona")

    # Sprawdź czy płatność już istnieje
    existing = db.query(Payment).filter(
        Payment.booking_id == booking_id,
        Payment.status == PaymentStatus.pending
    ).first()

    if existing:
        # Zwróć istniejącą pending płatność
        transaction_id = existing.transaction_id
        amount = existing.amount
        payment_id = existing.id
    else:
        amount = _calculate_amount(db, booking)
        transaction_id = f"EMU-{uuid.uuid4().hex[:16].upper()}"

        payment = Payment(
            booking_id=booking_id,
            amount=amount,
            status=PaymentStatus.pending,
            payment_method="emulation",
            transaction_id=transaction_id,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        payment_id = payment.id

    # ── Generowanie URL ──
    # W emulacji → strona na froncie; w produkcji → URL HotPay
    is_immediate = requires_immediate_payment(booking)
    payment_url = f"{settings.FRONTEND_APP_URL}/payment/{booking_id}"

    # Przygotowanie pod HotPay:
    # W przyszłości tutaj byłoby:
    # payment_url = hotpay_create_payment(amount=amount, description=f"Lekcja #{booking_id}", ...)

    return {
        "payment_id": payment_id,
        "booking_id": booking_id,
        "amount": amount,
        "payment_url": payment_url,
        "requires_immediate_payment": is_immediate,
    }


def emulate_payment(db: Session, booking_id: int, current_user_id: int) -> Payment:
    """
    Symuluje udaną płatność (emulacja HotPay).
    W produkcji ten endpoint zostanie zastąpiony callbackiem z HotPay.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie znaleziona")

    if booking.student_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="To nie Twoja rezerwacja")

    payment = db.query(Payment).filter(
        Payment.booking_id == booking_id,
        Payment.status == PaymentStatus.pending
    ).first()

    if not payment:
        # Auto-inicjalizacja jeśli nie ma pending płatności
        amount = _calculate_amount(db, booking)
        payment = Payment(
            booking_id=booking_id,
            amount=amount,
            status=PaymentStatus.pending,
            payment_method="emulation",
            transaction_id=f"EMU-{uuid.uuid4().hex[:16].upper()}",
        )
        db.add(payment)
        db.flush()

    # Symulacja udanej płatności
    payment.status = PaymentStatus.completed
    payment.paid_at = datetime.utcnow()

    # Zmień status bookingu na confirmed
    booking.status = BookingStatus.confirmed

    db.commit()
    db.refresh(payment)

    # ── Wyślij maila do korepetytora ──
    try:
        from services.mail_service import send_tutor_payment_confirmed_email
        from models.user import User

        tutor_user = db.query(User).filter(User.id == booking.tutor_id).first()
        student_user = db.query(User).filter(User.id == booking.student_id).first()
        
        if tutor_user and tutor_user.email:
            tutor_name = tutor_user.name
            student_name = student_user.name if student_user else f"Uczeń #{booking.student_id}"
            lesson_date = booking.start_time.strftime("%d.%m.%Y (%A)")
            lesson_time = f"{booking.start_time.strftime('%H:%M')} – {booking.end_time.strftime('%H:%M')}"

            send_tutor_payment_confirmed_email(
                recipient_email=tutor_user.email,
                tutor_name=tutor_name,
                student_name=student_name,
                lesson_date=lesson_date,
                lesson_time=lesson_time,
            )
    except Exception as e:
        logger.error("Failed to send tutor payment confirmed email for booking %s: %s", booking_id, e)

    logger.info("Emulated payment completed for booking %s, amount %s PLN", booking_id, payment.amount)
    return payment


def get_payment_status(db: Session, booking_id: int, current_user_id: int) -> dict:
    """Pobiera status płatności dla danego bookingu."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rezerwacja nie znaleziona")

    if booking.student_id != current_user_id and booking.tutor_id != current_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak dostępu")

    payment = db.query(Payment).filter(Payment.booking_id == booking_id).order_by(Payment.created_at.desc()).first()

    if not payment:
        amount = _calculate_amount(db, booking)
        return {
            "booking_id": booking_id,
            "payment_status": PaymentStatus.pending,
            "amount": amount,
            "paid_at": None,
        }

    return {
        "booking_id": booking_id,
        "payment_status": payment.status,
        "amount": payment.amount,
        "paid_at": payment.paid_at,
    }


def get_my_payments(db: Session, current_user_id: int):
    """Pobiera wszystkie płatności użytkownika."""
    return db.query(Payment).join(Booking).filter(
        Booking.student_id == current_user_id
    ).order_by(Payment.created_at.desc()).all()


def hotpay_callback(db: Session, data: dict):
    """
    Placeholder dla przyszłego callbacku HotPay.
    W produkcji tutaj będzie weryfikacja podpisu i aktualizacja płatności.

    Przykładowa struktura danych z HotPay:
    {
        "KWOTA": "150.00",
        "ID_PLATNOSCI": "abc123",
        "STATUS": "SUCCESS",
        "SEKRET": "...",
        "HASH": "...",
    }
    """
    logger.info("HotPay callback received (placeholder): %s", data)

    # W przyszłości:
    # 1. Weryfikuj HASH
    # 2. Znajdź payment po transaction_id
    # 3. Zaktualizuj status
    # 4. Zmień booking.status na confirmed

    return {"status": "ok"}
