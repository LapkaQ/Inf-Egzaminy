from fastapi import FastAPI
from routers import auth, tutors, availability, bookings, sessions, stats
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.include_router(auth.router)
app.include_router(tutors.router)
app.include_router(availability.router)
app.include_router(bookings.router)
app.include_router(sessions.router)
app.include_router(stats.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)