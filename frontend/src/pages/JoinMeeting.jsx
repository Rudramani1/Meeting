import { useState } from "react";
import { useNavigate } from "react-router-dom";


function JoinMeeting() {

    const [name, setName] = useState("");
    const [meetingId, setMeetingId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();


    async function handleJoinMeeting() {

        const trimmedName = name.trim();
        const trimmedMeetingId =
            meetingId.trim().toUpperCase();


        // =============================================
        // VALIDATE NAME
        // =============================================

        if (!trimmedName) {

            setError("Please enter your name");

            return;
        }


        // =============================================
        // VALIDATE MEETING ID
        // =============================================

        if (!trimmedMeetingId) {

            setError("Please enter the meeting ID");

            return;
        }


        try {

            setLoading(true);
            setError("");


            // =========================================
            // CHECK MEETING
            // =========================================

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/join`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        meeting_id:
                            trimmedMeetingId
                    })
                }
            );


            const data =
                await response.json();


            // =========================================
            // MEETING DOES NOT EXIST
            // =========================================

            if (!data.success) {

                setError(
                    data.message ||
                    "Meeting not found"
                );

                return;
            }


            // =========================================
            // CREATE USER
            // =========================================

            const user = {

                name: trimmedName,

                uid: crypto
                    .randomUUID()
                    .slice(0, 8)

            };


            sessionStorage.setItem(
                "user",
                JSON.stringify(user)
            );


            // =========================================
            // ENTER MEETING
            // =========================================

            navigate(
                `/meeting/${data.meeting_id}`
            );

        } catch (error) {

            console.error(
                "Join meeting failed:",
                error
            );

            setError(
                "Unable to connect to server"
            );

        } finally {

            setLoading(false);

        }
    }


    return (

        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md rounded-2xl bg-gray-900 p-8">

                {/* =====================================
                    TITLE
                ====================================== */}

                <h1 className="text-3xl font-semibold text-center">
                    Join Meeting
                </h1>


                <p className="mt-3 text-center text-gray-400">
                    Enter your name and meeting ID
                </p>


                {/* =====================================
                    NAME
                ====================================== */}

                <div className="mt-8">

                    <label className="block text-sm font-medium text-gray-300">
                        Your Name
                    </label>


                    <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        placeholder="Enter your name"
                        className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>


                {/* =====================================
                    MEETING ID
                ====================================== */}

                <div className="mt-5">

                    <label className="block text-sm font-medium text-gray-300">
                        Meeting ID
                    </label>


                    <input
                        type="text"
                        value={meetingId}
                        onChange={(event) =>
                            setMeetingId(
                                event.target.value
                            )
                        }
                        placeholder="Enter meeting ID"
                        className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 text-white uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>


                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (

                    <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>

                )}


                {/* =====================================
                    JOIN BUTTON
                ====================================== */}

                <button
                    onClick={handleJoinMeeting}
                    disabled={loading}
                    className={`mt-6 w-full rounded-lg px-5 py-3 font-semibold text-white transition ${
                        loading
                            ? "bg-indigo-800 cursor-not-allowed"
                            : "bg-indigo-500 hover:bg-indigo-400"
                    }`}
                >

                    {loading
                        ? "Checking meeting..."
                        : "Join Meeting"}

                </button>

            </div>

        </div>
    );
}


export default JoinMeeting;