import uuid


meetings = {}


def create_meeting(name: str):
    uid = str(uuid.uuid4())[:8]

    meeting_id = str(uuid.uuid4())[:6].upper()

    meetings[meeting_id] = {
        "host_id": uid,
        "host_name": name,
        "participants": {}
    }

    return {
        "uid": uid,
        "meeting_id": meeting_id
    }


def meeting_exists(meeting_id: str):
    return meeting_id in meetings