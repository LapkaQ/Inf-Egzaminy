from fastapi import FastAPI
from routers import auth, tutors, availability, bookings, sessions, stats, schedule, admin, meetings
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="KorkiINF API", version="1.0.0")

# CORS must be added BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tutors.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(sessions.router)
app.include_router(stats.router)
app.include_router(schedule.router)
app.include_router(admin.router)
app.include_router(meetings.router)