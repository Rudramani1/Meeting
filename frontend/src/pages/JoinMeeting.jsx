import { useState } from "react";
import { useNavigate } from "react-router-dom";


function JoinMeeting() {

    const [name, setName] =
        useState("");

    const [meetingId, setMeetingId] =
        useState("");

    const navigate =
        useNavigate();


    function handleJoinMeeting() {

        // Remove extra spaces
        const trimmedName =
            name.trim();

        const trimmedMeetingId =
            meetingId.trim();


        // Check name
        if (!trimmedName) {

            alert("Please enter your name");

            return;
        }


        // Check meeting ID
        if (!trimmedMeetingId) {

            alert("Please enter the meeting ID");

            return;
        }


        // Create user object
        const user = {

            name: trimmedName,

            uid:
                crypto.randomUUID()
                .slice(0, 8)

        };


        // Store user information
        sessionStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        console.log(
            "Joining meeting:",
            trimmedMeetingId
        );

        console.log(
            "User:",
            user
        );


        // Navigate to meeting
        navigate(
            `/meeting/${trimmedMeetingId.toUpperCase()}`
        );
    }


    return (

        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md rounded-2xl bg-gray-900 p-8">


                {/* =========================================
                    TITLE
                ========================================== */}

                <h1 className="text-3xl font-semibold text-center">

                    Join Meeting

                </h1>


                <p className="mt-3 text-center text-gray-400">

                    Enter your name and meeting ID

                </p>


                {/* =========================================
                    NAME
                ========================================== */}

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


                {/* =========================================
                    MEETING ID
                ========================================== */}

                <div className="mt-5">

                    <label className="block text-sm font-medium text-gray-300">

                        Meeting ID

                    </label>


                    <input
                        type="text"
                        value={meetingId}
                        onChange={(event) =>
                            setMeetingId(event.target.value)
                        }
                        placeholder="Enter meeting ID"
                        className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>


                {/* =========================================
                    JOIN BUTTON
                ========================================== */}

                <button
                    onClick={handleJoinMeeting}
                    className="mt-6 w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400"
                >

                    Join Meeting

                </button>


            </div>

        </div>

    );
}


export default JoinMeeting;