import { useState } from "react";


function Chat({
    messages,
    onSendMessage,
    currentUserId,
    currentUserName,
    onClose
}) {

    const [message, setMessage] =
        useState("");


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    function handleSendMessage() {

        const trimmedMessage =
            message.trim();


        if (!trimmedMessage) {
            return;
        }


        onSendMessage(
            trimmedMessage
        );


        setMessage("");

    }


    // =====================================================
    // ENTER KEY
    // =====================================================

    function handleKeyDown(event) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            handleSendMessage();

        }

    }


    return (

        <div className="fixed right-4 top-4 bottom-24 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col">


            {/* =================================================
                HEADER
            ================================================== */}

            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">

                <div>

                    <h2 className="text-lg font-semibold">

                        Chat

                    </h2>


                    <p className="text-xs text-gray-400">

                        Meeting messages

                    </p>

                </div>


                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                    title="Close chat"
                >

                    ✕

                </button>

            </div>


            {/* =================================================
                MESSAGES
            ================================================== */}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">


                {messages.length === 0 && (

                    <div className="h-full flex items-center justify-center">

                        <div className="text-center text-gray-500">

                            <div className="text-4xl">
                                💬
                            </div>

                            <p className="mt-2">
                                No messages yet
                            </p>

                            <p className="text-xs mt-1">
                                Start the conversation
                            </p>

                        </div>

                    </div>

                )}


                {messages.map(
                    (chatMessage, index) => {

                        const isMe =
                            chatMessage.senderId ===
                            currentUserId;


                        return (

                            <div
                                key={
                                    chatMessage.id ||
                                    index
                                }
                                className={`flex ${
                                    isMe
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >

                                <div
                                    className={`max-w-[80%] ${
                                        isMe
                                            ? "bg-indigo-600"
                                            : "bg-gray-800"
                                    } rounded-xl px-3 py-2`}
                                >


                                    {/* Sender */}

                                    {!isMe && (

                                        <p className="text-xs text-indigo-300 font-medium mb-1">

                                            {
                                                chatMessage.senderName ||
                                                "User"
                                            }

                                        </p>

                                    )}


                                    {/* Message */}

                                    <p className="text-sm break-words">

                                        {
                                            chatMessage.text
                                        }

                                    </p>


                                    {/* Time */}

                                    <p className="text-[10px] text-gray-300 mt-1 text-right">

                                        {
                                            chatMessage.time
                                        }

                                    </p>

                                </div>

                            </div>

                        );

                    }
                )}

            </div>


            {/* =================================================
                INPUT
            ================================================== */}

            <div className="p-3 border-t border-gray-700">

                <div className="flex items-center gap-2">


                    <input
                        type="text"
                        value={message}
                        onChange={(event) =>
                            setMessage(
                                event.target.value
                            )
                        }
                        onKeyDown={
                            handleKeyDown
                        }
                        placeholder="Type a message..."
                        className="flex-1 min-w-0 bg-gray-800 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />


                    <button
                        onClick={
                            handleSendMessage
                        }
                        className="bg-indigo-600 hover:bg-indigo-500 rounded-xl px-4 py-3 font-medium"
                    >

                        Send

                    </button>

                </div>

            </div>

        </div>

    );

}


export default Chat;