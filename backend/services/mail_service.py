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
    # Resolve SMTP credentials: prefer SMTP_USER, fall back to GMAIL_USER
    smtp_user = settings.SMTP_USER or settings.GMAIL_USER
    smtp_password = settings.SMTP_PASSWORD or settings.GMAIL_PASSWORD

    if not smtp_user or not smtp_password:
        logger.error("SMTP credentials not configured (SMTP_USER/SMTP_PASSWORD or GMAIL_USER/GMAIL_PASSWORD)")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.APP_NAME} <{smtp_user}>"
        msg["To"] = recipient_email

        body_part = MIMEText(body, "html", "utf-8")
        msg.attach(body_part)

        if settings.SMTP_USE_SSL:
            # Implicit SSL (port 465)
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        else:
            # Plain or STARTTLS (port 587 / 25)
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_USE_TLS:
                server.starttls()

        with server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [recipient_email], msg.as_string())

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
            "app_name": settings.APP_NAME,
        },
    )
    send_email(recipient_email, f"Potwierdź rejestrację w {settings.APP_NAME}", body)


def send_forgot_password_email(recipient_email: str, name: str, reset_link: str):
    """Send a forgot password email."""
    body = render_template(
        "forgot_password_mail.html",
        {
            "name": name,
            "reset_link": reset_link,
            "app_name": settings.APP_NAME,
        },
    )
    send_email(recipient_email, f"Resetowanie hasła – {settings.APP_NAME}", body)


def send_password_changed_email(recipient_email: str, name: str):
    """Send a notification that password was changed."""
    body = render_template(
        "password_changed_mail.html",
        {
            "name": name,
            "app_name": settings.APP_NAME,
            "login_link": f"{settings.FRONTEND_APP_URL}/login",
        },
    )
    send_email(recipient_email, f"Hasło zostało zmienione – {settings.APP_NAME}", body)


def send_custom_email(recipient_email: str, subject: str, message: str, name: str = ""):
    """Send a custom admin email to a user."""
    body = render_template(
        "custom_mail.html",
        {
            "name": name,
            "message": message,
            "app_name": settings.APP_NAME,
        },
    )
    send_email(recipient_email, subject, body)


def send_welcome_verified_email(recipient_email: str, name: str):
    """Send a welcome email after verification."""
    body = render_template(
        "welcome_mail.html",
        {
            "name": name,
            "app_name": settings.APP_NAME,
            "login_link": f"{settings.FRONTEND_APP_URL}/login",
        },
    )
    send_email(recipient_email, f"Witaj w {settings.APP_NAME}! 🎉", body)


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
            "app_name": settings.APP_NAME,
        },
    )
    send_email(recipient_email, f"💳 Opłać lekcję – {lesson_date} – {settings.APP_NAME}", body)