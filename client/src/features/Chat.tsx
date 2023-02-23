import React, { useEffect, useRef } from 'react';
import { useSockets } from '../context/socket.context';
import { events } from '../../../common/config/events';
import { Button } from 'flowbite-react';

function Chat() {
    const { socket, messages, roomId, username, setMessages } = useSockets();
    const newMessageRef = useRef<HTMLTextAreaElement | null>(null);
    const messageEndRef = useRef<HTMLInputElement | null>(null);

    function handleSendMessage() {
        const message = newMessageRef?.current?.value;

        if (!String(message).trim()) {
            return;
        }

        socket.emit(events.CLIENT.SEND_ROOM_MESSAGE, {
            roomId,
            message,
            username,
        });

        const date = new Date();

        setMessages([
            ...messages,
            {
                username: 'You',
                message,
                time: `${date.getHours()}:${date.getMinutes()}`,
            },
        ]);

        if (newMessageRef.current) {
            newMessageRef.current.value = '';
        }
    }

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!roomId) {
        return <div />;
    }
    return (
        <div className="relative w-full">
            <div className="overflow-y-scroll h-full p-4 pb-14">
                {messages.map(({ message, username, time }, index) => {
                    return username ? (
                        <div key={index}>
                            <div
                                key={index}
                                className="flex flex-col mb-6 text-sm"
                            >
                                <span>
                                    {username} - {time}
                                </span>
                                <span className="break-words w-full bg-slate-200 p-4 rounded-lg text-lg">
                                    {message}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="flex items-center justify-center">
                            {time} - {message}
                        </span>
                    );
                })}
                <div ref={messageEndRef} />
            </div>
            <div className="flex absolute bottom-0 w-full p-4 ">
                <textarea
                    id="message"
                    rows={1}
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Write your thoughts here..."
                    ref={newMessageRef}
                ></textarea>
                <Button onClick={handleSendMessage}>Send</Button>
            </div>
        </div>
    );
}

export default Chat;
