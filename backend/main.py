from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateMeeting(BaseModel):
    name: str


@app.post("/create")
def create_meeting(data: CreateMeeting):

    uid = str(uuid.uuid4())[:8]

    meeting_id = str(uuid.uuid4())[:6].upper()

    return {
        "name": data.name,
        "uid": uid,
        "meeting_id": meeting_id
    }