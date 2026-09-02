from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid


app = FastAPI()


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Create Meeting
# -----------------------------

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


# =====================================================
# MEETING CONNECTIONS
# =====================================================

# Example:
#
# meetings = {
#     "ABC123": {
#         "user1": websocket1,
#         "user2": websocket2
#     }
# }

# =====================================================
# MEETING CONNECTIONS
# =====================================================

meetings = {}


# =====================================================
# WEBSOCKET
# =====================================================

@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str
):

    await websocket.accept()

    # Get name from query parameter
    name = websocket.query_params.get(
        "name",
        "Unknown User"
    )

    # Create unique user ID
    user_id = str(uuid.uuid4())[:8]

    print(
        f"User {user_id} ({name}) "
        f"connected to meeting {meeting_id}"
    )


    # -----------------------------
    # Create meeting
    # -----------------------------

    if meeting_id not in meetings:
        meetings[meeting_id] = {}


    # -----------------------------
    # Store user information
    # -----------------------------

    meetings[meeting_id][user_id] = {
        "socket": websocket,
        "name": name
    }


    print(
        f"Users in meeting {meeting_id}: "
        f"{len(meetings[meeting_id])}"
    )


    try:

        # =================================================
        # SEND USER ID
        # =================================================

        await websocket.send_json({

            "type": "user-id",

            "userId": user_id,

            "name": name

        })


        # =================================================
        # SEND EXISTING USERS
        # =================================================

        existing_users = []


        for uid, user_data in meetings[
            meeting_id
        ].items():

            if uid != user_id:

                existing_users.append({

                    "userId": uid,

                    "name": user_data["name"]

                })


        await websocket.send_json({

            "type": "existing-users",

            "users": existing_users

        })


        # =================================================
        # TELL EXISTING USERS ABOUT NEW USER
        # =================================================

        for uid, user_data in meetings[
            meeting_id
        ].items():

            if uid != user_id:

                await user_data["socket"].send_json({

                    "type": "user-joined",

                    "userId": user_id,

                    "name": name

                })


        # =================================================
        # RECEIVE SIGNALING MESSAGES
        # =================================================

        while True:

            message = await websocket.receive_json()


            print(
                f"Message from {user_id}: "
                f"{message.get('type')}"
            )


            # -----------------------------
            # Target user
            # -----------------------------

            target_user = message.get("target")


            if target_user:

                target_data =meetings[meeting_id].get(target_user)


                if target_data:

                    await target_data[
                        "socket"
                    ].send_json({

                        **message,

                        "sender": user_id,

                        "senderName": name

                    })


    except WebSocketDisconnect:

        print(
            f"User {user_id} ({name}) "
            f"disconnected from meeting {meeting_id}"
        )


        # =================================================
        # REMOVE USER
        # =================================================

        if meeting_id in meetings:

            if user_id in meetings[
                meeting_id
            ]:

                del meetings[
                    meeting_id
                ][user_id]


            # =================================================
            # NOTIFY REMAINING USERS
            # =================================================

            for user_data in meetings[
                meeting_id
            ].values():

                await user_data[
                    "socket"
                ].send_json({

                    "type": "user-left",

                    "userId": user_id

                })


            print(
                f"Users in meeting {meeting_id}: "
                f"{len(meetings[meeting_id])}"
            )


            # =================================================
            # DELETE EMPTY MEETING
            # =================================================

            if len(meetings[meeting_id]) == 0:

                del meetings[meeting_id]