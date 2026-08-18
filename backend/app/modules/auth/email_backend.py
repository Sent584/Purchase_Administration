"""Pluggable OTP/notification email dispatch.

No SMTP credentials exist yet, so the default "console" backend just logs the
message to the backend server's stdout/log — good enough for development and
demos. Once real SMTP (or an email API) credentials are available, set
EMAIL_BACKEND=smtp and fill SMTP_* in .env; smtplib wiring is stubbed below
so that's a config change, not a rewrite.
"""

import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger("sasurie.email")


def send_email(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()

    if settings.email_backend == "smtp":
        if not settings.smtp_host:
            raise RuntimeError("EMAIL_BACKEND=smtp but SMTP_HOST is not configured")
        message = MIMEText(body)
        message["Subject"] = subject
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        message["To"] = to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_username:
                server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [to_email], message.as_string())
        return

    # console/dev backend
    logger.info("=== [DEV EMAIL] To: %s | Subject: %s ===\n%s\n=== end email ===", to_email, subject, body)


def send_otp_email(to_email: str, otp: str, purpose: str, validity_minutes: int) -> None:
    purpose_label = "sign-in" if purpose == "login" else "password reset"
    subject = f"Sasurie ERP — Your {purpose_label} OTP"
    body = (
        f"Your one-time password for {purpose_label} is: {otp}\n\n"
        f"This code is valid for {validity_minutes} minute(s). Do not share it with anyone.\n"
        f"If you did not request this, please contact your institution's helpdesk immediately.\n\n"
        f"— Sasurie Group of Institutions"
    )
    send_email(to_email, subject, body)
