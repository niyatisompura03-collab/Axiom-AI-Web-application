from fastapi import FastAPI

from backend.routes.chat import router as chat_router
from backend.routes.settings import router as settings_router
from backend.routes.memories import router as memories_router
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.auth import router as auth_router

app = FastAPI(
    title="AI Learning Chatbot",
    version="1.0.0"
)


app.include_router(chat_router)
app.include_router(settings_router)
app.include_router(memories_router)
app.include_router(auth_router)



@app.get("/")
def home():

    return {
        "message": "Backend is running!"
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)