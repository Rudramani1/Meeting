from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from dotenv import load_dotenv

from Meeting.routes import router as meeting_router
from Meeting.websocket import router as websocket_router
from Voice.routes import router as voice_router


app = FastAPI()


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()

frontend_api = os.getenv("FRONTEND_API_URL")


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_api
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# ROUTERS
# =====================================================

app.include_router(meeting_router)
app.include_router(websocket_router)
app.include_router(voice_router)


# =====================================================
# ROOT
# =====================================================

@app.get("/")
def root():
    return {
        "message": "MeetAI backend is running"
    }