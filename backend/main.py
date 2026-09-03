import os
import logging
from fastapi import FastAPI

from backend.routes.chat import router as chat_router
from backend.routes.settings import router as settings_router
from backend.routes.memories import router as memories_router
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.auth import router as auth_router
from backend.routes.documents import router as documents_router
from dotenv import load_dotenv


load_dotenv()

# Configure logging so INFO and ERROR logs from services are clearly visible
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

app = FastAPI(
    title="AI Learning Chatbot",
    version="1.0.0"
)


app.include_router(chat_router)
app.include_router(settings_router)
app.include_router(memories_router)
app.include_router(auth_router)
app.include_router(documents_router, prefix="/documents")




@app.get("/")
def home():

    return {
        "message": "Backend is running!"
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)