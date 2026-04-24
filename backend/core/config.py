from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Inf-Egzaminy.pl"
    DATABASE_HOSTNAME: str
    DATABASE_USERNAME: str
    DATABASE_PASSWORD: str
    DATABASE_PORT: int
    DATABASE_NAME: str

    # SMTP settings
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True      # STARTTLS on port 587
    SMTP_USE_SSL: bool = False     # Implicit SSL on port 465

    # Legacy Gmail fields (fallback for SMTP_USER / SMTP_PASSWORD)
    GMAIL_USER: str = ""
    GMAIL_PASSWORD: str = ""

    TOKEN_EXPIRATION_DATE_HOURS: int
    FRONTEND_APP_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Zoom API (Server-to-Server OAuth) — opcjonalne
    ZOOM_ACCOUNT_ID: str = ""
    ZOOM_CLIENT_ID: str = ""
    ZOOM_CLIENT_SECRET: str = ""

    class Config:
        env_file = "../.env"


settings = Settings()
