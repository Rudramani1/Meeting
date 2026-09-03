function VideoTile({
    videoRef,
    name,
    muted = false,
    micOn = true,
    cameraOn = true,
    screenSharing = false
}) {
    const displayName =
        typeof name === "string"
            ? name
            : name?.name || "Unknown User";
    return (
        <div className="relative w-full h-full min-h-[250px] bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">

            {/* Video */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover"
            />

            {/* Camera Off */}
            {!cameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-semibold">
                        {name
                            ? name.charAt(0).toUpperCase()
                            : "U"}
                    </div>
                </div>
            )}

            {/* Name */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-medium">
                        {displayName}
                    </span>
                </div>

                {!micOn && (
                    <div className="bg-red-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                        <span className="text-sm">
                            🔇
                        </span>
                    </div>
                )}
            </div>
            {/* Screen Sharing */}
            {screenSharing && (
                <div className="absolute top-3 left-3 bg-green-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                    🖥️ Sharing screen
                </div>
            )}
        </div>
    );
}

export default VideoTile;