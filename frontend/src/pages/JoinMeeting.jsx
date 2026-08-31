function JoinMeeting() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

            <div className="w-full max-w-md rounded-2xl bg-gray-900 p-8">

                <h1 className="text-3xl font-semibold text-center">
                    Join Meeting
                </h1>

                <p className="mt-3 text-center text-gray-400">
                    Enter the meeting ID to join
                </p>

                <div className="mt-8">

                    <label className="block text-sm font-medium text-gray-300">
                        Meeting ID
                    </label>

                    <input
                        type="text"
                        placeholder="Enter meeting ID"
                        className="mt-2 w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>

                <button
                    className="mt-6 w-full rounded-lg bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-400"
                >
                    Join Meeting
                </button>

            </div>

        </div>
    )
}

export default JoinMeeting