import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Chat from "../components/Chat";
import ControlBar from "../components/ControlBar";
import Participants from "../components/Participants";
import VideoTile from "../components/VideoTile";


function Meeting() {

    // =====================================================
    // REFS
    // =====================================================

    const localVideoRef = useRef(null);

    const peerConnectionsRef = useRef({});

    const remoteVideosRef = useRef({});

    const streamRef = useRef(null);

    const screenStreamRef = useRef(null);

    const socketRef = useRef(null);

    const myUserIdRef = useRef(null);

    const iceQueuesRef = useRef({});


    // =====================================================
    // STATE
    // =====================================================

    const [remoteUsers, setRemoteUsers] =
        useState([]);

    const [participants, setParticipants] =
        useState({});

    const [myUserId, setMyUserId] =
        useState(null);

    const [cameraOn, setCameraOn] =
        useState(true);

    const [micOn, setMicOn] =
        useState(true);

    const [screenSharing, setScreenSharing] =
        useState(false);

    const [chatOpen, setChatOpen] =
        useState(false);

    const [messages, setMessages] =
        useState([]);
    const [participantsOpen, setParticipantsOpen] = useState(false);


    // =====================================================
    // ROUTER
    // =====================================================

    const { meetingId } = useParams();

    const navigate = useNavigate();


    // =====================================================
    // ENVIRONMENT
    // =====================================================

    const API_URL =
        import.meta.env.VITE_API_URL;


    // =====================================================
    // CURRENT USER
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
        // Don't create duplicate connection
        // -------------------------------------------------

        if (
            peerConnectionsRef.current[userId]
        ) {

            return (
                peerConnectionsRef.current[userId]
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


        // =================================================
        // ADD LOCAL CAMERA + MICROPHONE
        // =================================================

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


        // =================================================
        // RECEIVE REMOTE TRACK
        // =================================================

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


        // =================================================
        // ICE CANDIDATE
        // =================================================

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


        // =================================================
        // CONNECTION STATE
        // =================================================

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


        // =================================================
        // STORE CONNECTION
        // =================================================

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

                    type:
                        "offer",

                    target:
                        userId,

                    offer:
                        offer

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
    // SEND CHAT MESSAGE
    // =====================================================

    function sendChatMessage(text) {

        if (

            !socketRef.current ||

            socketRef.current.readyState !==
            WebSocket.OPEN

        ) {

            console.error(
                "WebSocket is not connected"
            );

            return;

        }


        socketRef.current.send(

            JSON.stringify({

                type:
                    "chat",

                text:
                    text

            })

        );


        console.log(
            "Chat message sent:",
            text
        );

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
                // CAMERA + MICROPHONE
                // =================================================

                const stream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({

                            video: true,

                            audio: true

                        });


                // -------------------------------------------------
                // Component was already removed
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
                // Store local stream
                // -------------------------------------------------

                streamRef.current =
                    stream;


                // -------------------------------------------------
                // Show local video
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
                // CREATE WEBSOCKET
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
                        )}&uid=${encodeURIComponent(
                            user?.uid || ""
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


                        // =========================================
                        // CHAT MESSAGE
                        // =========================================

                        if (
                            message.type ===
                            "chat"
                        ) {

                            const chatMessage = {

                                id:
                                    crypto.randomUUID(),

                                senderId:
                                    message.senderId,

                                senderName:
                                    message.senderName,

                                text:
                                    message.text,

                                time:
                                    new Date()
                                        .toLocaleTimeString(
                                            [],
                                            {
                                                hour:
                                                    "2-digit",

                                                minute:
                                                    "2-digit"
                                            }
                                        )

                            };


                            setMessages(
                                (currentMessages) => [

                                    ...currentMessages,

                                    chatMessage

                                ]
                            );


                            return;

                        }


                        // =========================================
                        // USER ID
                        // =========================================

                        if (
                            message.type ===
                            "user-id"
                        ) {

                            myUserIdRef.current =
                                message.userId;


                            setMyUserId(
                                message.userId
                            );


                            setParticipants(
                                (current) => ({
                                    ...current,
                                    [message.userId]: {
                                        name: message.name,
                                        micOn: true,
                                        cameraOn: true
                                    }
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


                        // =========================================
                        // EXISTING USERS
                        // =========================================

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
                                        [participant.userId]: {
                                            name: participant.name,
                                            micOn: true,
                                            cameraOn: true
                                        }
                                    })
                                );


                                await createOffer(
                                    participant.userId
                                );

                            }

                        }


                        // =========================================
                        // USER JOINED
                        // =========================================

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
                                    [userId]: {
                                        name: name,
                                        micOn: true,
                                        cameraOn: true
                                    }
                                })
                            );

                        }
                        // =========================================
                        // MICROPHONE STATUS
                        // =========================================

                        if (
                            message.type ===
                            "mic-status"
                        ) {
                            const userId =
                                message.userId;

                            console.log(
                                "MIC STATUS RECEIVED:",
                                message
                            );

                            setParticipants(
                                (current) => {
                                    const participant =
                                        current[userId];

                                    return {
                                        ...current,
                                        [userId]: {
                                            name:
                                                participant?.name ||
                                                "Unknown User",

                                            micOn:
                                                message.micOn,

                                            cameraOn:
                                                participant?.cameraOn ??
                                                true
                                        }
                                    };
                                }
                            );

                            return;
                        }
                        // =========================================
                        // CAMERA STATUS
                        // =========================================

                        if (
                            message.type ===
                            "camera-status"
                        ) {
                            const userId =
                                message.userId;

                            console.log(
                                "CAMERA STATUS RECEIVED:",
                                message
                            );

                            setParticipants(
                                (current) => {
                                    const participant =
                                        current[userId];

                                    return {
                                        ...current,
                                        [userId]: {
                                            name:
                                                participant?.name ||
                                                "Unknown User",

                                            micOn:
                                                participant?.micOn ??
                                                true,

                                            cameraOn:
                                                message.cameraOn
                                        }
                                    };
                                }
                            );

                            return;
                        }

                        // =========================================
                        // OFFER
                        // =========================================

                        if (
                            message.type ===
                            "offer"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]: {
                                        name: message.senderName || userId,
                                        micOn: true,
                                        cameraOn: true
                                    }

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


                            // ------------------------------------------------
                            // Remote description
                            // ------------------------------------------------

                            await peerConnection
                                .setRemoteDescription(
                                    message.offer
                                );


                            console.log(
                                "Remote description set"
                            );


                            // ------------------------------------------------
                            // Queued ICE
                            // ------------------------------------------------

                            await addQueuedIceCandidates(
                                userId,
                                peerConnection
                            );


                            // ------------------------------------------------
                            // Create answer
                            // ------------------------------------------------

                            const answer =
                                await peerConnection
                                    .createAnswer();


                            // ------------------------------------------------
                            // Set local description
                            // ------------------------------------------------

                            await peerConnection
                                .setLocalDescription(
                                    answer
                                );


                            // ------------------------------------------------
                            // Send answer
                            // ------------------------------------------------

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


                        // =========================================
                        // ANSWER
                        // =========================================

                        if (
                            message.type ===
                            "answer"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]: {
                                        name: message.senderName || userId,
                                        micOn: true,
                                        cameraOn: true
                                    }

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


                        // =========================================
                        // ICE CANDIDATE
                        // =========================================

                        if (
                            message.type ===
                            "ice-candidate"
                        ) {

                            const userId =
                                message.sender;


                            setParticipants(
                                (current) => ({

                                    ...current,

                                    [userId]: {
                                        name: message.senderName || userId,
                                        micOn: true,
                                        cameraOn: true
                                    }

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


                            // ------------------------------------------------
                            // Peer doesn't exist yet
                            // ------------------------------------------------

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


                            // ------------------------------------------------
                            // Remote description exists
                            // ------------------------------------------------

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


                            // ------------------------------------------------
                            // Remote description doesn't exist
                            // ------------------------------------------------

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


                        // =========================================
                        // USER LEFT
                        // =========================================

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


        // =====================================================
        // CLEANUP
        // =====================================================

        return () => {

            cancelled = true;


            // -------------------------------------------------
            // Stop screen sharing
            // -------------------------------------------------

            if (
                screenStreamRef.current
            ) {

                screenStreamRef.current
                    .getTracks()
                    .forEach(
                        (track) => {

                            track.onended =
                                null;

                            track.stop();

                        }
                    );


                screenStreamRef.current =
                    null;

            }


            // -------------------------------------------------
            // Stop camera + microphone
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
        if (!streamRef.current) {
            return;
        }

        const videoTrack =
            streamRef.current.getVideoTracks()[0];

        if (!videoTrack) {
            return;
        }

        videoTrack.enabled =
            !videoTrack.enabled;

        const newCameraState =
            videoTrack.enabled;

        setCameraOn(newCameraState);

        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(
                JSON.stringify({
                    type: "camera-status",
                    cameraOn: newCameraState
                })
            );
        }
    }


    // =====================================================
    // TOGGLE MICROPHONE
    // =====================================================

    function toggleMic() {
        if (!streamRef.current) {
            return;
        }

        const audioTrack =
            streamRef.current.getAudioTracks()[0];

        if (!audioTrack) {
            return;
        }

        audioTrack.enabled =
            !audioTrack.enabled;

        const newMicState =
            audioTrack.enabled;

        setMicOn(newMicState);

        if (
            socketRef.current &&
            socketRef.current.readyState === WebSocket.OPEN
        ) {
            socketRef.current.send(
                JSON.stringify({
                    type: "mic-status",
                    micOn: newMicState
                })
            );
        }
    }


    // =====================================================
    // START SCREEN SHARE
    // =====================================================

    async function startScreenShare() {

        try {

            console.log(
                "Starting screen share..."
            );


            // -------------------------------------------------
            // Ask browser for screen
            // -------------------------------------------------

            const screenStream =
                await navigator
                    .mediaDevices
                    .getDisplayMedia({

                        video: true,

                        audio: false

                    });


            const screenTrack =
                screenStream
                    .getVideoTracks()[0];


            if (!screenTrack) {

                return;

            }


            screenStreamRef.current =
                screenStream;


            // =================================================
            // REPLACE CAMERA TRACK
            // =================================================

            const peerConnections =
                Object.values(
                    peerConnectionsRef.current
                );


            for (
                const peerConnection
                of peerConnections
            ) {

                const videoSender =
                    peerConnection
                        .getSenders()
                        .find(
                            (sender) =>
                                sender.track &&
                                sender.track.kind ===
                                "video"
                        );


                if (videoSender) {

                    await videoSender
                        .replaceTrack(
                            screenTrack
                        );

                }

            }


            // =================================================
            // SHOW SCREEN LOCALLY
            // =================================================

            if (
                localVideoRef.current
            ) {

                localVideoRef.current.srcObject =
                    screenStream;

            }


            setScreenSharing(
                true
            );


            console.log(
                "Screen sharing started"
            );


            // =================================================
            // BROWSER STOP SHARING
            // =================================================

            screenTrack.onended =
                () => {

                    console.log(
                        "Browser stopped screen share"
                    );


                    stopScreenShare();

                };


        } catch (error) {

            console.error(
                "Screen sharing failed:",
                error
            );

        }

    }


    // =====================================================
    // STOP SCREEN SHARE
    // =====================================================

    async function stopScreenShare() {

        console.log(
            "Stopping screen share..."
        );


        const cameraTrack =
            streamRef.current
                ?.getVideoTracks()[0];


        if (!cameraTrack) {

            return;

        }


        // =================================================
        // REPLACE SCREEN WITH CAMERA
        // =================================================

        const peerConnections =
            Object.values(
                peerConnectionsRef.current
            );


        for (
            const peerConnection
            of peerConnections
        ) {

            const videoSender =
                peerConnection
                    .getSenders()
                    .find(
                        (sender) =>
                            sender.track &&
                            sender.track.kind ===
                            "video"
                    );


            if (videoSender) {

                try {

                    await videoSender
                        .replaceTrack(
                            cameraTrack
                        );

                } catch (error) {

                    console.error(
                        "Could not restore camera:",
                        error
                    );

                }

            }

        }


        // =================================================
        // STOP SCREEN TRACK
        // =================================================

        if (
            screenStreamRef.current
        ) {

            screenStreamRef.current
                .getTracks()
                .forEach(
                    (track) => {

                        track.onended =
                            null;

                        track.stop();

                    }
                );


            screenStreamRef.current =
                null;

        }


        // =================================================
        // RESTORE LOCAL CAMERA
        // =================================================

        if (
            localVideoRef.current
        ) {

            localVideoRef.current.srcObject =
                streamRef.current;

        }


        setScreenSharing(
            false
        );


        console.log(
            "Screen sharing stopped"
        );

    }


    // =====================================================
    // TOGGLE SCREEN SHARE
    // =====================================================

    async function toggleScreenShare() {

        if (screenSharing) {

            await stopScreenShare();

        } else {

            await startScreenShare();

        }

    }


    // =====================================================
    // LEAVE MEETING
    // =====================================================

    function leaveMeeting() {

        console.log(
            "Leaving meeting..."
        );


        // -------------------------------------------------
        // Stop screen sharing
        // -------------------------------------------------

        if (
            screenStreamRef.current
        ) {

            screenStreamRef.current
                .getTracks()
                .forEach(
                    (track) => {

                        track.onended =
                            null;

                        track.stop();

                    }
                );


            screenStreamRef.current =
                null;

        }


        // -------------------------------------------------
        // Stop camera + microphone
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
    // PARTICIPANT COUNT
    // =====================================================

    const participantCount =
        remoteUsers.length + 1;


    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-28">

            {/* =================================================
                HEADER
            ================================================== */}

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


            {/* =================================================
                VIDEO GRID
            ================================================== */}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">

                {/* =============================================
                    LOCAL VIDEO
                ============================================== */}

                <div className="relative aspect-video">
                    <VideoTile
                        videoRef={localVideoRef}
                        name={user?.name || "You"}
                        muted={true}
                        micOn={micOn}
                        cameraOn={cameraOn}
                        screenSharing={screenSharing}
                    />

                </div>


                {/* =============================================
                    REMOTE VIDEOS
                ============================================== */}

                {remoteUsers.map(
                    (userId) => (
                        <div
                            key={userId}
                            className="relative aspect-video"
                        >

                            <VideoTile
                                videoRef={(element) => {
                                    if (
                                        element &&
                                        remoteVideosRef.current[userId]
                                    ) {
                                        element.srcObject =
                                            remoteVideosRef.current[userId];
                                    }
                                }}
                                name={
                                    participants[userId]?.name ||
                                    "User"
                                }
                                muted={false}
                                micOn={
                                    participants[userId]?.micOn ?? true
                                }
                                cameraOn={
                                    participants[userId]?.cameraOn ?? true
                                }
                                screenSharing={false}
                            />

                        </div>
                    )
                )}

            </div>


            {/* =================================================
                CONTROL BAR
            ================================================== */}

            <ControlBar
                micOn={micOn}
                cameraOn={cameraOn}
                screenSharing={screenSharing}
                chatOpen={chatOpen}
                participantsOpen={participantsOpen}

                onToggleMic={toggleMic}

                onToggleCamera={toggleCamera}

                onToggleScreenShare={
                    toggleScreenShare
                }

                onToggleChat={() =>
                    setChatOpen(
                        (current) => !current
                    )
                }

                onToggleParticipants={() =>
                    setParticipantsOpen(
                        (current) => !current
                    )
                }

                onLeave={leaveMeeting}
            />


            {/* =================================================
                CHAT
            ================================================== */}

            {chatOpen && (
                <Chat
                    messages={messages}
                    onSendMessage={sendChatMessage}
                    currentUserId={myUserId}
                    currentUserName={user?.name}
                    onClose={() =>
                        setChatOpen(false)
                    }
                />
            )}


            {/* =================================================
                PARTICIPANTS
            ================================================== */}

            {participantsOpen && (
                <Participants
                    participants={participants}
                    currentUserId={myUserId}
                    onClose={() =>
                        setParticipantsOpen(false)
                    }
                />
            )}

        </div>
    );
}

export default Meeting;