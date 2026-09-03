function ControlBar({
    micOn,
    cameraOn,
    screenSharing,
    chatOpen,
    onToggleMic,
    onToggleCamera,
    onToggleScreenShare,
    participantsOpen,
    onToggleParticipants,
    onToggleChat,
    onLeave
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 border-t border-gray-800">
            <div className="flex items-center justify-center gap-3 px-4 py-4">

                {/* Microphone */}
                <button
                    onClick={onToggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${micOn
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "bg-red-600 hover:bg-red-500"
                        }`}
                    title={micOn ? "Mute microphone" : "Unmute microphone"}
                >
                    {micOn ? "🎤" : "🔇"}
                </button>

                {/* Camera */}
                <button
                    onClick={onToggleCamera}
                    disabled={screenSharing}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${!cameraOn
                            ? "bg-red-600 hover:bg-red-500"
                            : "bg-gray-800 hover:bg-gray-700"
                        } ${screenSharing
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                    title={
                        screenSharing
                            ? "Stop screen sharing to control camera"
                            : cameraOn
                                ? "Turn off camera"
                                : "Turn on camera"
                    }
                >
                    {cameraOn ? "📹" : "🚫"}
                </button>

                {/* Screen Share */}
                <button
                    onClick={onToggleScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${screenSharing
                            ? "bg-green-600 hover:bg-green-500"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    title={
                        screenSharing
                            ? "Stop screen sharing"
                            : "Share screen"
                    }
                >
                    🖥️
                </button>

                {/* Chat */}
                <button
                    onClick={onToggleChat}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${chatOpen
                            ? "bg-indigo-600 hover:bg-indigo-500"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    title={chatOpen ? "Close chat" : "Open chat"}
                >
                    💬
                </button>
                {/* Participants */}
                <button
                    onClick={onToggleParticipants}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition ${participantsOpen
                            ? "bg-indigo-600 hover:bg-indigo-500"
                            : "bg-gray-800 hover:bg-gray-700"
                        }`}
                    title={
                        participantsOpen
                            ? "Close participants"
                            : "Show participants"
                    }
                >
                    👥
                </button>

                {/* Leave */}
                <button
                    onClick={onLeave}
                    className="ml-3 px-5 h-12 rounded-full bg-red-600 hover:bg-red-500 font-semibold transition"
                    title="Leave meeting"
                >
                    Leave
                </button>

            </div>
        </div>
    );
}

export default ControlBar;