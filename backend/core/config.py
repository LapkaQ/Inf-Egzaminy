from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_HOSTNAME: str
    DATABASE_USERNAME: str
    DATABASE_PASSWORD: str
    DATABASE_PORT: int
    DATABASE_NAME: str
    GMAIL_USER: str
    GMAIL_PASSWORD: str
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
