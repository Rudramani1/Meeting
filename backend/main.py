from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid


app = FastAPI()


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# MEETING STORAGE
# =====================================================

meetings = {}


# =====================================================
# CREATE MEETING
# =====================================================

class CreateMeeting(BaseModel):
    name: str


@app.post("/create")
def create_meeting(data: CreateMeeting):

    name = data.name.strip()

    if not name:
        return {
            "success": False,
            "message": "Name is required"
        }

    uid = str(uuid.uuid4())[:8]

    meeting_id = str(uuid.uuid4())[:6].upper()

    meetings[meeting_id] = {
        "host_id": uid,
        "host_name": name,
        "participants": {}
    }

    print(
        f"Meeting created: {meeting_id} "
        f"by {name}"
    )

    return {
        "success": True,
        "name": name,
        "uid": uid,
        "meeting_id": meeting_id
    }


# =====================================================
# JOIN MEETING
# =====================================================

class JoinMeeting(BaseModel):
    meeting_id: str


@app.post("/join")
def join_meeting(data: JoinMeeting):

    meeting_id = data.meeting_id.strip().upper()

    if meeting_id not in meetings:

        print(
            f"Join failed: meeting {meeting_id} "
            f"does not exist"
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


# =====================================================
# WEBSOCKET
# =====================================================

@app.websocket("/ws/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str
):

    meeting_id = meeting_id.strip().upper()


    # =================================================
    # CHECK MEETING
    # =================================================

    if meeting_id not in meetings:

        await websocket.close(
            code=1008,
            reason="Meeting not found"
        )

        print(
            f"WebSocket rejected: "
            f"meeting {meeting_id} not found"
        )

        return


    # =================================================
    # ACCEPT CONNECTION
    # =================================================

    await websocket.accept()


    # =================================================
    # GET USER INFORMATION
    # =================================================

    name = websocket.query_params.get(
        "name",
        "Unknown User"
    )

    name = name.strip()

    if not name:
        name = "Unknown User"


    user_id = str(uuid.uuid4())[:8]


    print(
        f"User {user_id} ({name}) "
        f"connected to meeting {meeting_id}"
    )


    # =================================================
    # GET PARTICIPANTS
    # =================================================

    participants = meetings[
        meeting_id
    ]["participants"]


    # =================================================
    # STORE USER
    # =================================================

    participants[user_id] = {
        "socket": websocket,
        "name": name
    }


    print(
        f"Users in meeting {meeting_id}: "
        f"{len(participants)}"
    )


    try:

        # =============================================
        # SEND USER ID
        # =============================================

        await websocket.send_json({
            "type": "user-id",
            "userId": user_id,
            "name": name
        })


        # =============================================
        # SEND EXISTING USERS
        # =============================================

        existing_users = []

        for uid, user_data in participants.items():

            if uid != user_id:

                existing_users.append({
                    "userId": uid,
                    "name": user_data["name"]
                })


        await websocket.send_json({
            "type": "existing-users",
            "users": existing_users
        })


        # =============================================
        # TELL EXISTING USERS ABOUT NEW USER
        # =============================================

        for uid, user_data in participants.items():

            if uid != user_id:

                try:

                    await user_data["socket"].send_json({
                        "type": "user-joined",
                        "userId": user_id,
                        "name": name
                    })

                except Exception as error:

                    print(
                        "Error notifying user:",
                        error
                    )


        # =============================================
        # RECEIVE MESSAGES
        # =============================================

        while True:

            message = await websocket.receive_json()


            print(
                f"Message from "
                f"{user_id}: "
                f"{message.get('type')}"
            )


            # =========================================
            # CHAT
            # =========================================

            if message.get("type") == "chat":

                text = message.get(
                    "text",
                    ""
                ).strip()


                if not text:
                    continue


                chat_message = {
                    "type": "chat",
                    "senderId": user_id,
                    "senderName": name,
                    "text": text
                }


                for user_data in participants.values():

                    try:

                        await user_data[
                            "socket"
                        ].send_json(
                            chat_message
                        )

                    except Exception as error:

                        print(
                            "Error sending chat:",
                            error
                        )


                continue

            if message.get("type") == "mic-status":

                status_message = {
                    "type": "mic-status",
                    "userId": user_id,
                    "micOn": message.get("micOn", True)
                }

                for user_data in participants.values():

                    try:
                        await user_data["socket"].send_json(
                            status_message
                        )

                    except Exception as error:
                        print(
                            "Error sending mic status:",
                            error
                        )

                continue


            if message.get("type") == "camera-status":

                status_message = {
                    "type": "camera-status",
                    "userId": user_id,
                    "cameraOn": message.get(
                        "cameraOn",
                        True
                    )
                }

                for user_data in participants.values():

                    try:
                        await user_data["socket"].send_json(
                            status_message
                        )

                    except Exception as error:
                        print(
                            "Error sending camera status:",
                            error
                        )

                continue

            # =========================================
            # SIGNALING MESSAGE
            # =========================================

            target_user = message.get(
                "target"
            )


            if target_user:

                target_data = participants.get(
                    target_user
                )


                if target_data:

                    try:

                        await target_data[
                            "socket"
                        ].send_json({

                            **message,

                            "sender": user_id,

                            "senderName": name

                        })

                    except Exception as error:

                        print(
                            "Error sending "
                            "signaling message:",
                            error
                        )


    except WebSocketDisconnect:

        print(
            f"User {user_id} ({name}) "
            f"disconnected from "
            f"meeting {meeting_id}"
        )


        # =============================================
        # REMOVE USER
        # =============================================

        if user_id in participants:

            del participants[user_id]


        # =============================================
        # NOTIFY REMAINING USERS
        # =============================================

        for user_data in participants.values():

            try:

                await user_data[
                    "socket"
                ].send_json({

                    "type": "user-left",

                    "userId": user_id

                })

            except Exception as error:

                print(
                    "Error notifying "
                    "user-left:",
                    error
                )


        print(
            f"Users in meeting {meeting_id}: "
            f"{len(participants)}"
        )


        # =============================================
        # KEEP MEETING ALIVE
        # =============================================

        # We intentionally do NOT delete the meeting
        # when everyone leaves.
        #
        # This means the meeting ID remains valid until
        # the backend server is restarted.