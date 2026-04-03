from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine.url import URL
from core.config import settings

URL_DATABASE = URL.create(
    drivername="mysql+pymysql",
    username=settings.DATABASE_USERNAME,
    password=settings.DATABASE_PASSWORD,
    host=settings.DATABASE_HOSTNAME,
    port=settings.DATABASE_PORT,
    database=settings.DATABASE_NAME,
)
engine = create_engine(URL_DATABASE)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


import models.availability, models.booking, models.session, models.tutor, models.user
