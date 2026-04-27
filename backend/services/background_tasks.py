import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from db.base import SessionLocal
from models.booking import Booking, BookingStatus
from models.user import User
from services.mail_service import send_lesson_starting_email

logger = logging.getLogger(__name__)

async def lesson_reminder_task():
    """Background task that runs every minute and sends 10-minute reminders for lessons."""
    logger.info("Lesson reminder background task started.")
    while True:
        try:
            now = datetime.utcnow()
            # Szukamy lekcji, które zaczynają się za 10-12 minut, są opłacone i nie wysłano przypomnienia.
            # Zrobimy bufor 12 minut aby w razie drobnego opóźnienia złapać lekcję
            target_time_min = now + timedelta(minutes=0)
            target_time_max = now + timedelta(minutes=15)

            with SessionLocal() as db:
                upcoming_bookings = db.query(Booking).options(
                    joinedload(Booking.session),
                    joinedload(Booking.tutor),
                    joinedload(Booking.student)
                ).filter(
                    Booking.status == BookingStatus.confirmed,
                    Booking.is_reminder_sent == False,
                    Booking.start_time >= target_time_min,
                    Booking.start_time <= target_time_max
                ).all()

                for booking in upcoming_bookings:
                    # Sprawdzamy czy został zaledwie kwadrans lub mniej, a dokładniej czy zaraz startuje (w obrębie 10-15 min)
                    time_until = booking.start_time - now
                    if time_until <= timedelta(minutes=10) and time_until > timedelta(minutes=-15):
                        student = booking.student
                        tutor = booking.tutor
                        meet_url = booking.session.meeting_url if booking.session else None
                        
                        if meet_url:
                            # format time: 15:00 - 16:00
                            lesson_time = f"{booking.start_time.strftime('%H:%M')} – {booking.end_time.strftime('%H:%M')}"
                            
                            # Wyślij do ucznia
                            if student and student.email:
                                try:
                                    send_lesson_starting_email(
                                        recipient_email=student.email,
                                        user_name=student.name,
                                        other_name=tutor.name if tutor else "Korepetytor",
                                        lesson_time=lesson_time,
                                        meeting_link=meet_url
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send 10min reminder to student for booking {booking.id}: {e}")

                            # Wyślij do korepetytora
                            if tutor and tutor.email:
                                try:
                                    send_lesson_starting_email(
                                        recipient_email=tutor.email,
                                        user_name=tutor.name,
                                        other_name=student.name if student else "Uczeń",
                                        lesson_time=lesson_time,
                                        meeting_link=meet_url
                                    )
                                except Exception as e:
                                    logger.error(f"Failed to send 10min reminder to tutor for booking {booking.id}: {e}")

                            # Oznacz jako wysłane
                            booking.is_reminder_sent = True
                            db.commit()

        except Exception as e:
            logger.error(f"Error in lesson_reminder_task loop: {e}")
            
        await asyncio.sleep(60) # Czekaj minutę
