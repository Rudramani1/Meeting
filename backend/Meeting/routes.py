from fastapi import APIRouter
from pydantic import BaseModel

from Meeting.manager import (
    meetings,
    create_meeting
)


router = APIRouter()


# =====================================================
# CREATE MEETING
# =====================================================

class CreateMeeting(BaseModel):
    name: str


@router.post("/create")
def create_meeting_route(
    data: CreateMeeting
):

    name = data.name.strip()

    if not name:

        return {
            "success": False,
            "message": "Name is required"
        }


    result = create_meeting(name)


    print(
        f"Meeting created: "
        f"{result['meeting_id']} "
        f"by {name}"
    )


    return {
        "success": True,
        "name": name,
        "uid": result["uid"],
        "meeting_id": result["meeting_id"]
    }


# =====================================================
# JOIN MEETING
# =====================================================

class JoinMeeting(BaseModel):
    meeting_id: str


@router.post("/join")
def join_meeting(
    data: JoinMeeting
):

    meeting_id = (
        data.meeting_id
        .strip()
        .upper()
    )


    if meeting_id not in meetings:

        print(
            f"Join failed: meeting "
            f"{meeting_id} does not exist"
        )

        return {
            "success": False,
            "message": "Meeting not found"
        }


    print(
        f"Join request for meeting: "
        f"{meeting_id}"
    )


    return {
        "success": True,
        "meeting_id": meeting_id
    }