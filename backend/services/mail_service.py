import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader
from core.config import settings

logger = logging.getLogger(__name__)

env = Environment(loader=FileSystemLoader("templates"))


def render_template(template_name: str, parameters: dict) -> str:
    template = env.get_template(template_name)
    return template.render(parameters)


def send_email(recipient_email: str, subject: str, body: str):
    """Send an email using SMTP. Designed to be called as a background task."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"KorINF <{settings.GMAIL_USER}>"
        msg["To"] = recipient_email

        body_part = MIMEText(body, "html", "utf-8")
        msg.attach(body_part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp_server:
            smtp_server.login(settings.GMAIL_USER, settings.GMAIL_PASSWORD)
            smtp_server.sendmail(
                settings.GMAIL_USER, [recipient_email], msg.as_string()
            )

        logger.info(f"Email sent to {recipient_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {e}")


def send_registration_email(recipient_email: str, name: str, confirmation_link: str):
    """Send a registration confirmation email."""
    body = render_template(
        "registration_mail.html",
        {
            "name": name,
            "confirmation_link": confirmation_link,
            "app_name": "KorINF",
        },
    )
    send_email(recipient_email, "Potwierdź rejestrację w KorINF", body)


def send_forgot_password_email(recipient_email: str, name: str, reset_link: str):
    """Send a forgot password email."""
    body = render_template(
        "forgot_password_mail.html",
        {
            "name": name,
            "reset_link": reset_link,
            "app_name": "KorINF",
        },
    )
    send_email(recipient_email, "Resetowanie hasła – KorINF", body)


def send_password_changed_email(recipient_email: str, name: str):
    """Send a notification that password was changed."""
    body = render_template(
        "password_changed_mail.html",
        {
            "name": name,
            "app_name": "KorINF",
            "login_link": f"{settings.FRONTEND_APP_URL}/login",
        },
    )
    send_email(recipient_email, "Hasło zostało zmienione – KorINF", body)


def send_custom_email(recipient_email: str, subject: str, message: str, name: str = ""):
    """Send a custom admin email to a user."""
    body = render_template(
        "custom_mail.html",
        {
            "name": name,
            "message": message,
            "app_name": "KorINF",
        },
    )
    send_email(recipient_email, subject, body)


def send_welcome_verified_email(recipient_email: str, name: str):
    """Send a welcome email after verification."""
    body = render_template(
        "welcome_mail.html",
        {
            "name": name,
            "app_name": "KorINF",
            "login_link": f"{settings.FRONTEND_APP_URL}/login",
        },
    )
    send_email(recipient_email, "Witaj w KorINF! 🎉", body)


def send_payment_reminder_email(
    recipient_email: str,
    name: str,
    tutor_name: str,
    lesson_date: str,
    lesson_time: str,
    amount: int,
    payment_link: str,
):
    """Send a payment reminder email before a lesson."""
    body = render_template(
        "payment_reminder_mail.html",
        {
            "name": name,
            "tutor_name": tutor_name,
            "lesson_date": lesson_date,
            "lesson_time": lesson_time,
            "amount": amount,
            "payment_link": payment_link,
            "app_name": "KorINF",
        },
    )
    send_email(recipient_email, f"💳 Opłać lekcję – {lesson_date} – KorINF", body)