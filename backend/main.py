from fastapi import FastAPI, APIRouter
from routers import auth, tutors, availability, bookings, sessions, stats, schedule, admin, meetings, contact, payments
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
import asyncio
from services.background_tasks import lesson_reminder_task

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uruchamiamy task w tle
    task = asyncio.create_task(lesson_reminder_task())
    yield
    # Anulujemy przy zamykaniu aplikacji
    task.cancel()

app = FastAPI(title="Inf-Egzaminy.pl API", version="1.0.0", lifespan=lifespan)

# CORS must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://inf-egzaminy.pl", "https://www.inf-egzaminy.pl", "http://localhost:5173", "http://127.0.0.1:5173", "http://inf-egzaminy.pl:20122", "http://inf-egzaminy.pl:80", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global /api prefix for all routers
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(tutors.router)
api_router.include_router(availability.router)
api_router.include_router(bookings.router)
api_router.include_router(sessions.router)
api_router.include_router(stats.router)
api_router.include_router(schedule.router)
api_router.include_router(admin.router)
api_router.include_router(meetings.router)
api_router.include_router(contact.router)
api_router.include_router(payments.router)

app.include_router(api_router)

