from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

import uuid

from Meeting.manager import meetings


router = APIRouter()


@router.websocket("/ws/{meeting_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    meeting_id: str
):

    meeting_id = (
        meeting_id
        .strip()
        .upper()
    )


    # =====================================================
    # CHECK MEETING
    # =====================================================

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


    await websocket.accept()


    # =====================================================
    # USER INFORMATION
    # =====================================================

    name = websocket.query_params.get(
        "name",
        "Unknown User"
    )

    name = name.strip()


    if not name:
        name = "Unknown User"


    user_id = websocket.query_params.get(
        "uid"
    )


    if not user_id:
        user_id = str(uuid.uuid4())[:8]


    print(
        f"User {user_id} ({name}) "
        f"connected to meeting {meeting_id}"
    )


    participants = meetings[
        meeting_id
    ]["participants"]


    participants[user_id] = {
        "socket": websocket,
        "name": name
    }


    print(
        f"Users in meeting {meeting_id}: "
        f"{len(participants)}"
    )


    try:

        # =================================================
        # SEND USER ID
        # =================================================

        await websocket.send_json({

            "type":
                "user-id",

            "userId":
                user_id,

            "name":
                name

        })


        # =================================================
        # SEND EXISTING USERS
        # =================================================

        existing_users = []


        for uid, user_data in participants.items():

            if uid != user_id:

                existing_users.append({

                    "userId":
                        uid,

                    "name":
                        user_data["name"]

                })


        await websocket.send_json({

            "type":
                "existing-users",

            "users":
                existing_users

        })


        # =================================================
        # NOTIFY EXISTING USERS
        # =================================================

        for uid, user_data in participants.items():

            if uid != user_id:

                try:

                    await user_data[
                        "socket"
                    ].send_json({

                        "type":
                            "user-joined",

                        "userId":
                            user_id,

                        "name":
                            name

                    })

                except Exception as error:

                    print(
                        "Error notifying user:",
                        error
                    )


        # =================================================
        # RECEIVE MESSAGES
        # =================================================

        while True:

            message = (
                await websocket.receive_json()
            )


            print(
                f"Message from "
                f"{user_id}: "
                f"{message.get('type')}"
            )


            # =================================================
            # CHAT
            # =================================================

            if message.get("type") == "chat":

                text = (
                    message
                    .get("text", "")
                    .strip()
                )


                if not text:
                    continue


                chat_message = {

                    "type":
                        "chat",

                    "senderId":
                        user_id,

                    "senderName":
                        name,

                    "text":
                        text

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


            # =================================================
            # MICROPHONE STATUS
            # =================================================

            if message.get(
                "type"
            ) == "mic-status":

                status_message = {

                    "type":
                        "mic-status",

                    "userId":
                        user_id,

                    "micOn":
                        message.get(
                            "micOn",
                            True
                        )

                }


                for user_data in participants.values():

                    try:

                        await user_data[
                            "socket"
                        ].send_json(
                            status_message
                        )

                    except Exception as error:

                        print(
                            "Error sending mic status:",
                            error
                        )


                continue


            # =================================================
            # CAMERA STATUS
            # =================================================

            if message.get(
                "type"
            ) == "camera-status":

                status_message = {

                    "type":
                        "camera-status",

                    "userId":
                        user_id,

                    "cameraOn":
                        message.get(
                            "cameraOn",
                            True
                        )

                }


                for user_data in participants.values():

                    try:

                        await user_data[
                            "socket"
                        ].send_json(
                            status_message
                        )

                    except Exception as error:

                        print(
                            "Error sending camera status:",
                            error
                        )


                continue


            # =================================================
            # WEBRTC SIGNALING
            # =================================================

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

                            "sender":
                                user_id,

                            "senderName":
                                name

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


        if user_id in participants:

            del participants[user_id]


        # =================================================
        # NOTIFY REMAINING USERS
        # =================================================

        for user_data in participants.values():

            try:

                await user_data[
                    "socket"
                ].send_json({

                    "type":
                        "user-left",

                    "userId":
                        user_id

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