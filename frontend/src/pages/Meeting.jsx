import { useParams } from "react-router-dom";

function Meeting() {

    const { meetingId } = useParams();

    const user = JSON.parse(
        sessionStorage.getItem("user")
    );

    return (
        <div>

            <h1>Meeting Room</h1>

            <p>
                Meeting ID: {meetingId}
            </p>

            <p>
                Welcome {user?.name}
            </p>

        </div>
    );
}

export default Meeting;