function Participants({
    participants,
    currentUserId,
    onClose
}) {
    const participantList =
        Object.entries(participants);
    console.log(
        "PARTICIPANTS:",
        participants
    );

    return (
        <div className="fixed right-4 top-4 bottom-24 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col">

            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                <div>
                    <h2 className="text-lg font-semibold">
                        Participants
                    </h2>

                    <p className="text-xs text-gray-400">
                        {participantList.length}{" "}
                        {participantList.length === 1
                            ? "participant"
                            : "participants"}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                    title="Close participants"
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">

                {participantList.map(
                    ([userId, participant]) => {

                        const isMe =
                            userId === currentUserId;

                        const name =
                            participant?.name ||
                            "Unknown User";

                        const micOn =
                            participant?.micOn ?? true;

                        const cameraOn =
                            participant?.cameraOn ?? true;

                        return (
                            <div
                                key={userId}
                                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-800 transition"
                            >

                                <div className="flex items-center gap-3">

                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold">
                                        {name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div>
                                        <p className="font-medium">
                                            {name}
                                        </p>

                                        {isMe && (
                                            <p className="text-xs text-indigo-400">
                                                You
                                            </p>
                                        )}
                                    </div>

                                </div>

                                <div className="flex items-center gap-2 text-sm">

                                    <span
                                        title={
                                            micOn
                                                ? "Microphone on"
                                                : "Microphone off"
                                        }
                                    >
                                        {micOn
                                            ? "🎤"
                                            : "🔇"}
                                    </span>

                                    <span
                                        title={
                                            cameraOn
                                                ? "Camera on"
                                                : "Camera off"
                                        }
                                    >
                                        {cameraOn
                                            ? "📹"
                                            : "🚫"}
                                    </span>

                                </div>

                            </div>
                        );
                    }
                )}

                {participantList.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        No participants
                    </div>
                )}

            </div>
        </div>
    );
}

export default Participants;