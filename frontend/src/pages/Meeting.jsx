import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


function Meeting() {

    // =====================================================
    // REFS
    // =====================================================

    const localVideoRef = useRef(null);

    const peerConnectionsRef =
        useRef({});

    const remoteVideosRef =
        useRef({});

    const streamRef =
        useRef(null);

    const socketRef =
        useRef(null);

    const myUserIdRef =
        useRef(null);

    const iceQueuesRef =
        useRef({});


    // =====================================================
    // STATE
    // =====================================================

    const [remoteUsers, setRemoteUsers] =
        useState([]);

    const [participants, setParticipants] =
        useState({});

    const [cameraOn, setCameraOn] =
        useState(true);

    const [micOn, setMicOn] =
        useState(true);


    // =====================================================
    // ROUTER
    // =====================================================

    const { meetingId } =
        useParams();

    const navigate =
        useNavigate();


    // =====================================================
    // ENVIRONMENT
    // =====================================================

    const API_URL =
        import.meta.env.VITE_API_URL;


    // =====================================================
    // USER
    // =====================================================

    const user =
        JSON.parse(
            sessionStorage.getItem("user")
        );


    // =====================================================
    // CREATE PEER CONNECTION
    // =====================================================

    function createPeerConnection(userId) {

        console.log(
            "Creating peer connection for:",
            userId
        );


        // -------------------------------------------------
        // Already exists
        // -------------------------------------------------

        if (
            peerConnectionsRef.current[userId]
        ) {

            return (
                peerConnectionsRef.current[
                    userId
                ]
            );
        }


        // -------------------------------------------------
        // Create RTCPeerConnection
        // -------------------------------------------------

        const peerConnection =
            new RTCPeerConnection({

                iceServers: [

                    {
                        urls:
                            "stun:stun.l.google.com:19302"
                    }

                ]

            });


        // -------------------------------------------------
        // Add local tracks
        // -------------------------------------------------

        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach((track) => {

                    peerConnection.addTrack(
                        track,
                        streamRef.current
                    );

                });

        }


        // -------------------------------------------------
        // Receive remote tracks
        // -------------------------------------------------

        peerConnection.ontrack =
            (event) => {

                console.log(
                    "Remote track received from:",
                    userId
                );


                const remoteStream =
                    event.streams[0];


                remoteVideosRef.current[
                    userId
                ] = remoteStream;


                setRemoteUsers(
                    (currentUsers) => {

                        if (
                            currentUsers.includes(
                                userId
                            )
                        ) {

                            return currentUsers;

                        }


                        return [

                            ...currentUsers,

                            userId

                        ];

                    }
                );

            };


        // -------------------------------------------------
        // ICE candidate
        // -------------------------------------------------

        peerConnection.onicecandidate =
            (event) => {

                if (

                    event.candidate &&

                    socketRef.current &&

                    socketRef.current.readyState ===
                        WebSocket.OPEN

                ) {

                    socketRef.current.send(

                        JSON.stringify({

                            type:
                                "ice-candidate",

                            target:
                                userId,

                            candidate:
                                event.candidate

                        })

                    );


                    console.log(
                        "ICE candidate sent to:",
                        userId
                    );

                }

            };


        // -------------------------------------------------
        // Connection state
        // -------------------------------------------------

        peerConnection.onconnectionstatechange =
            () => {

                console.log(

                    `Connection with ${userId}:`,

                    peerConnection.connectionState

                );


                if (

                    peerConnection.connectionState ===
                        "failed" ||

                    peerConnection.connectionState ===
                        "disconnected" ||

                    peerConnection.connectionState ===
                        "closed"

                ) {

                    removePeerConnection(
                        userId
                    );

                }

            };


        // -------------------------------------------------
        // Store connection
        // -------------------------------------------------

        peerConnectionsRef.current[
            userId
        ] = peerConnection;


        return peerConnection;
    }


    // =====================================================
    // REMOVE PEER CONNECTION
    // =====================================================

    function removePeerConnection(userId) {

        console.log(
            "Removing peer connection:",
            userId
        );


        const peerConnection =
            peerConnectionsRef.current[
                userId
            ];


        if (peerConnection) {

            peerConnection.close();

            delete peerConnectionsRef.current[
                userId
            ];

        }


        delete remoteVideosRef.current[
            userId
        ];


        delete iceQueuesRef.current[
            userId
        ];


        setRemoteUsers(
            (currentUsers) =>
                currentUsers.filter(
                    (id) =>
                        id !== userId
                )
        );


        setParticipants(
            (currentParticipants) => {

                const updated = {
                    ...currentParticipants
                };

                delete updated[userId];

                return updated;

            }
        );

    }


    // =====================================================
    // CREATE OFFER
    // =====================================================

    async function createOffer(userId) {

        console.log(
            "Creating offer for:",
            userId
        );


        const peerConnection =
            createPeerConnection(
                userId
            );


        // -------------------------------------------------
        // Create offer
        // -------------------------------------------------

        const offer =
            await peerConnection.createOffer();


        // -------------------------------------------------
        // Set local description
        // -------------------------------------------------

        await peerConnection
            .setLocalDescription(
                offer
            );


        // -------------------------------------------------
        // Send offer
        // -------------------------------------------------

        if (
            socketRef.current &&
            socketRef.current.readyState ===
                WebSocket.OPEN
        ) {

            socketRef.current.send(

                JSON.stringify({

                    type: "offer",

                    target: userId,

                    offer: offer

                })

            );


            console.log(
                "Offer sent to:",
                userId
            );

        }

    }


    // =====================================================
    // ADD QUEUED ICE CANDIDATES
    // =====================================================

    async function addQueuedIceCandidates(
        userId,
        peerConnection
    ) {

        const queue =
            iceQueuesRef.current[
                userId
            ];


        if (!queue) {

            return;

        }


        console.log(
            "Adding queued ICE candidates for:",
            userId
        );


        for (
            const candidate of queue
        ) {

            try {

                await peerConnection
                    .addIceCandidate(
                        candidate
                    );

            } catch (error) {

                console.error(
                    "Error adding queued ICE:",
                    error
                );

            }

        }


        iceQueuesRef.current[
            userId
        ] = [];

    }


    // =====================================================
    // START MEETING
    // =====================================================

    useEffect(() => {

        let cancelled = false;


        async function startMeeting() {

            try {

                console.log(
                    "Requesting camera and microphone..."
                );


                // =================================================
                // GET CAMERA + MICROPHONE
                // =================================================

                const stream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({

                            video: true,

                            audio: true

                        });


                // -------------------------------------------------
                // If component was already removed
                // -------------------------------------------------

                if (cancelled) {

                    stream
                        .getTracks()
                        .forEach(
                            (track) =>
                                track.stop()
                        );

                    return;

                }


                // -------------------------------------------------
                // Store stream
                // -------------------------------------------------

                streamRef.current =
                    stream;


                // -------------------------------------------------
                // Display local video
                // -------------------------------------------------

                if (
                    localVideoRef.current
                ) {

                    localVideoRef.current.srcObject =
                        stream;

                }


                console.log(
                    "Camera and microphone started."
                );


                // =================================================
                // WEBSOCKET URL
                // =================================================

                const WS_URL =
                    API_URL.replace(
                        "http",
                        "ws"
                    );


                const participantName =
                    user?.name ||
                    "Unknown User";


                const socket =
                    new WebSocket(

                        `${WS_URL}/ws/${meetingId}?name=${encodeURIComponent(
                            participantName
                        )}`

                    );


                socketRef.current =
                    socket;


                // =================================================
                // WEBSOCKET OPEN
                // =================================================

                socket.onopen = () => {

                    console.log(
                        "WebSocket connected"
                    );

                };


                // =================================================
                // WEBSOCKET MESSAGE
                // =================================================

                socket.onmessage =
                    async (event) => {

                        const message =
                            JSON.parse(
                                event.data
                            );


                        console.log(
                            "Message received:",
                            message
                        );


                        // =================================================
                        // USER ID
                        // =================================================

                        if (
                            message.type ===
                            "user-id"
                        ) {

                            myUserIdRef.current =
                                message.userId;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [message.userId]:
                                        message.name

                                })
                            );


                            console.log(
                                "My user ID:",
                                message.userId
                            );


                            console.log(
                                "My name:",
                                message.name
                            );

                        }


                        // =================================================
                        // EXISTING USERS
                        // =================================================

                        if (
                            message.type ===
                            "existing-users"
                        ) {

                            console.log(
                                "Existing users:",
                                message.users
                            );


                            for (
                                const participant
                                of message.users
                            ) {

                                setParticipants(
                                    (current) => ({

                                        ...current,

                                        [participant.userId]:
                                            participant.name

                                    })
                                );


                                await createOffer(
                                    participant.userId
                                );

                            }

                        }


                        // =================================================
                        // USER JOINED
                        // =================================================

                        if (
                            message.type ===
                            "user-joined"
                        ) {

                            const userId =
                                message.userId;

                            const name =
                                message.name;


                            console.log(
                                `New user joined: ${name} (${userId})`
                            );


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]:
                                        name

                                })
                            );

                        }


                        // =================================================
                        // OFFER
                        // =================================================

                        if (
                            message.type ===
                            "offer"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]:
                                        message.senderName ||
                                        userId

                                })
                            );


                            console.log(
                                "Offer received from:",
                                userId
                            );


                            const peerConnection =
                                createPeerConnection(
                                    userId
                                );


                            // -------------------------------------------------
                            // Set remote description
                            // -------------------------------------------------

                            await peerConnection
                                .setRemoteDescription(
                                    message.offer
                                );


                            console.log(
                                "Remote description set"
                            );


                            // -------------------------------------------------
                            // Add queued ICE
                            // -------------------------------------------------

                            await addQueuedIceCandidates(
                                userId,
                                peerConnection
                            );


                            // -------------------------------------------------
                            // Create answer
                            // -------------------------------------------------

                            const answer =
                                await peerConnection
                                    .createAnswer();


                            // -------------------------------------------------
                            // Set local description
                            // -------------------------------------------------

                            await peerConnection
                                .setLocalDescription(
                                    answer
                                );


                            // -------------------------------------------------
                            // Send answer
                            // -------------------------------------------------

                            socket.send(

                                JSON.stringify({

                                    type:
                                        "answer",

                                    target:
                                        userId,

                                    answer:
                                        answer

                                })

                            );


                            console.log(
                                "Answer sent to:",
                                userId
                            );

                        }


                        // =================================================
                        // ANSWER
                        // =================================================

                        if (
                            message.type ===
                            "answer"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]:
                                        message.senderName ||
                                        userId

                                })
                            );


                            console.log(
                                "Answer received from:",
                                userId
                            );


                            const peerConnection =
                                peerConnectionsRef
                                    .current[
                                        userId
                                    ];


                            if (
                                !peerConnection
                            ) {

                                console.error(
                                    "No peer connection for:",
                                    userId
                                );

                                return;

                            }


                            await peerConnection
                                .setRemoteDescription(
                                    message.answer
                                );


                            console.log(
                                "Remote description set for:",
                                userId
                            );


                            await addQueuedIceCandidates(
                                userId,
                                peerConnection
                            );

                        }


                        // =================================================
                        // ICE CANDIDATE
                        // =================================================

                        if (
                            message.type ===
                            "ice-candidate"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]:
                                        message.senderName ||
                                        userId

                                })
                            );


                            console.log(
                                "ICE candidate received from:",
                                userId
                            );


                            const peerConnection =
                                peerConnectionsRef
                                    .current[
                                        userId
                                    ];


                            // -------------------------------------------------
                            // Peer doesn't exist yet
                            // -------------------------------------------------

                            if (
                                !peerConnection
                            ) {

                                if (
                                    !iceQueuesRef
                                        .current[
                                            userId
                                        ]
                                ) {

                                    iceQueuesRef
                                        .current[
                                            userId
                                        ] = [];

                                }


                                iceQueuesRef
                                    .current[
                                        userId
                                    ]
                                    .push(
                                        message.candidate
                                    );


                                console.log(
                                    "ICE candidate queued"
                                );


                                return;

                            }


                            // -------------------------------------------------
                            // Remote description exists
                            // -------------------------------------------------

                            if (
                                peerConnection
                                    .remoteDescription
                            ) {

                                try {

                                    await peerConnection
                                        .addIceCandidate(
                                            message.candidate
                                        );


                                    console.log(
                                        "ICE candidate added"
                                    );

                                } catch (error) {

                                    console.error(
                                        "Error adding ICE:",
                                        error
                                    );

                                }

                            }


                            // -------------------------------------------------
                            // Remote description doesn't exist
                            // -------------------------------------------------

                            else {

                                if (
                                    !iceQueuesRef
                                        .current[
                                            userId
                                        ]
                                ) {

                                    iceQueuesRef
                                        .current[
                                            userId
                                        ] = [];

                                }


                                iceQueuesRef
                                    .current[
                                        userId
                                    ]
                                    .push(
                                        message.candidate
                                    );


                                console.log(
                                    "ICE candidate queued"
                                );

                            }

                        }


                        // =================================================
                        // USER LEFT
                        // =================================================

                        if (
                            message.type ===
                            "user-left"
                        ) {

                            const userId =
                                message.userId;


                            console.log(
                                "User left:",
                                userId
                            );


                            removePeerConnection(
                                userId
                            );

                        }

                    };


                // =================================================
                // WEBSOCKET ERROR
                // =================================================

                socket.onerror =
                    (error) => {

                        console.error(
                            "WebSocket error:",
                            error
                        );

                    };


                // =================================================
                // WEBSOCKET CLOSE
                // =================================================

                socket.onclose =
                    () => {

                        console.log(
                            "WebSocket disconnected"
                        );

                    };


            } catch (error) {

                if (!cancelled) {

                    console.error(
                        "Meeting setup failed:",
                        error
                    );

                }

            }

        }


        startMeeting();


        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            cancelled = true;


            // -------------------------------------------------
            // Stop local tracks
            // -------------------------------------------------

            if (
                streamRef.current
            ) {

                streamRef.current
                    .getTracks()
                    .forEach(
                        (track) => {
                            track.stop();
                        }
                    );


                streamRef.current =
                    null;

            }


            // -------------------------------------------------
            // Close peer connections
            // -------------------------------------------------

            Object.values(
                peerConnectionsRef.current
            ).forEach(
                (peerConnection) => {

                    peerConnection.close();

                }
            );


            peerConnectionsRef.current =
                {};


            // -------------------------------------------------
            // Close WebSocket
            // -------------------------------------------------

            if (
                socketRef.current
            ) {

                socketRef.current.close();

                socketRef.current =
                    null;

            }


            // -------------------------------------------------
            // Clear ICE queues
            // -------------------------------------------------

            iceQueuesRef.current =
                {};


            // -------------------------------------------------
            // Clear local video
            // -------------------------------------------------

            if (
                localVideoRef.current
            ) {

                localVideoRef.current.srcObject =
                    null;

            }

        };


    }, [meetingId]);


    // =====================================================
    // TOGGLE CAMERA
    // =====================================================

    function toggleCamera() {

        const videoTrack =
            streamRef.current
                ?.getVideoTracks()[0];


        if (!videoTrack) {

            return;

        }


        videoTrack.enabled =
            !videoTrack.enabled;


        setCameraOn(
            videoTrack.enabled
        );

    }


    // =====================================================
    // TOGGLE MICROPHONE
    // =====================================================

    function toggleMic() {

        const audioTrack =
            streamRef.current
                ?.getAudioTracks()[0];


        if (!audioTrack) {

            return;

        }


        audioTrack.enabled =
            !audioTrack.enabled;


        setMicOn(
            audioTrack.enabled
        );

    }


    // =====================================================
    // LEAVE MEETING
    // =====================================================

    function leaveMeeting() {

        console.log(
            "Leaving meeting..."
        );


        // -------------------------------------------------
        // Stop local tracks
        // -------------------------------------------------

        if (
            streamRef.current
        ) {

            streamRef.current
                .getTracks()
                .forEach(
                    (track) =>
                        track.stop()
                );


            streamRef.current =
                null;

        }


        // -------------------------------------------------
        // Close peer connections
        // -------------------------------------------------

        Object.values(
            peerConnectionsRef.current
        ).forEach(
            (peerConnection) =>
                peerConnection.close()
        );


        peerConnectionsRef.current =
            {};


        // -------------------------------------------------
        // Close WebSocket
        // -------------------------------------------------

        if (
            socketRef.current
        ) {

            socketRef.current.close();

            socketRef.current =
                null;

        }


        // -------------------------------------------------
        // Remove user
        // -------------------------------------------------

        sessionStorage.removeItem(
            "user"
        );


        // -------------------------------------------------
        // Go home
        // -------------------------------------------------

        navigate("/");

    }


    // =====================================================
    // TOTAL PARTICIPANTS
    // =====================================================

    const participantCount =
        remoteUsers.length + 1;


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="min-h-screen bg-black text-white p-6">

            {/* ==============================================
                HEADER
            =============================================== */}

            <div className="flex justify-between items-center">

                <div>

                    <h1 className="text-2xl font-bold">
                        Meeting Room
                    </h1>

                    <p className="mt-1 text-gray-400">
                        Meeting ID: {meetingId}
                    </p>

                </div>


                <div className="bg-gray-800 px-4 py-2 rounded-lg">

                    👥 {participantCount}

                </div>

            </div>


            {/* ==============================================
                WELCOME
            =============================================== */}

            <p className="mt-4 text-gray-300">

                Welcome{" "}

                <span className="font-semibold text-white">

                    {user?.name}

                </span>

            </p>


            {/* ==============================================
                VIDEO GRID
            =============================================== */}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">


                {/* ==========================================
                    LOCAL VIDEO
                =========================================== */}

                <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden">

                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />


                    {/* Name */}

                    <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-lg">

                        {user?.name} (You)

                    </div>


                    {/* Camera off indicator */}

                    {!cameraOn && (

                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">

                            <div className="text-5xl">
                                📷
                            </div>

                        </div>

                    )}

                </div>


                {/* ==========================================
                    REMOTE VIDEOS
                =========================================== */}

                {remoteUsers.map(
                    (userId) => (

                        <div
                            key={userId}
                            className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden"
                        >

                            <video
                                autoPlay
                                playsInline
                                ref={(element) => {

                                    if (
                                        element &&
                                        remoteVideosRef.current[
                                            userId
                                        ]
                                    ) {

                                        element.srcObject =
                                            remoteVideosRef.current[
                                                userId
                                            ];

                                    }

                                }}
                                className="w-full h-full object-cover"
                            />


                            {/* Name */}

                            <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-1 rounded-lg">

                                {
                                    participants[
                                        userId
                                    ] ||
                                    "User"
                                }

                            </div>

                        </div>

                    )
                )}

            </div>


            {/* ==============================================
                CONTROLS
            =============================================== */}

            <div className="fixed bottom-6 left-1/2 -translate-x-1/2">

                <div className="flex items-center gap-3 bg-gray-900 border border-gray-700 px-4 py-3 rounded-2xl shadow-xl">


                    {/* ======================================
                        MICROPHONE
                    ======================================= */}

                    <button
                        onClick={toggleMic}
                        className={`px-4 py-3 rounded-xl transition ${
                            micOn
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >

                        {micOn
                            ? "🎤"
                            : "🔇"}

                    </button>


                    {/* ======================================
                        CAMERA
                    ======================================= */}

                    <button
                        onClick={toggleCamera}
                        className={`px-4 py-3 rounded-xl transition ${
                            cameraOn
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-red-600 hover:bg-red-700"
                        }`}
                    >

                        {cameraOn
                            ? "📹"
                            : "📷"}

                    </button>


                    {/* ======================================
                        LEAVE
                    ======================================= */}

                    <button
                        onClick={leaveMeeting}
                        className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition font-semibold"
                    >

                        Leave

                    </button>

                </div>

            </div>

        </div>

    );

}


export default Meeting;