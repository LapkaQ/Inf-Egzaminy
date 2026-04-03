from fastapi import FastAPI
from routers import auth, tutors

app = FastAPI()

app.include_router(auth.router)
app.include_router(tutors.router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
