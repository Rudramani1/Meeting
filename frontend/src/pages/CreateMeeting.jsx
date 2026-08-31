import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMeeting } from "../services/MeetingService";

function CreateMeeting() {

    const [name, setName] = useState("");
    const navigate = useNavigate();

async function handleCreate() {

    try {

        const data = await createMeeting(name);

        sessionStorage.setItem(
            "user",
            JSON.stringify(data)
        );

        navigate(`/meeting/${data.meeting_id}`);

    } catch (error) {

        console.error(error);

    }

}

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md rounded-2xl bg-gray-900 p-8">

                <h1 className="text-3xl font-semibold text-center">
                    Create Meeting
                </h1>

                <p className="mt-3 text-center text-gray-400">
                    Enter your name to start a meeting
                </p>

                <div className="mt-8">

                    <label className="block text-sm font-medium text-gray-300">
                        Your Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>

                <button
                    onClick={handleCreate}
                    className="mt-6 w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400"
                >
                    Create Meeting
                </button>

            </div>

        </div>
    );
}

export default CreateMeeting;