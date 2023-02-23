import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../config/default';
import { events } from '../../../common/config/events';

interface Context {
    socket: Socket;
    username?: string;
    setUsername: Function;
    location?: string;
    setLocation: Function;
    messages: Message[];
    setMessages: Function;
    roomId?: string;
    rooms: Record<string, { name: string }>;
}

interface Message {
    message: string;
    username?: string;
    time: string;
}

const socket = io(SOCKET_URL);

const SocketContext = createContext<Context>({
    socket,
    setUsername: () => false,
    setMessages: () => false,
    setLocation: () => false,
    rooms: {},
    messages: [],
});

function SocketsProvider(props: any) {
    const [username, setUsername] = useState<string>('');
    const [location, setLocation] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [rooms, setRooms] = useState<Record<string, { name: string }>>({});
    const [messages, setMessages] = useState<Message[]>([{message: '', username: '', time: ''}]);

    useEffect(() => {
        window.onfocus = function () {
            document.title = 'Chat app';
        };
    }, []);

    socket.on(events.SERVER.ROOMS, (value) => {
        setRooms(value);
    });

    socket.on(events.SERVER.JOINED_ROOM, (value) => {
        setRoomId(value);
        setMessages([]);
    });

    useEffect(() => {
        socket.on(events.SERVER.ROOM_MESSAGE, ({ message, username, time }) => {
            if (!document.hasFocus()) {
                document.title = 'New message...';
            }

            setMessages((messages) => [
                ...messages,
                { message, username, time },
            ]);
        });
    }, [socket]);

    return (
        <SocketContext.Provider
            value={{
                socket,
                username,
                setUsername,
                rooms,
                roomId,
                messages,
                setMessages,
                location,
                setLocation,
            }}
            {...props}
        />
    );
}

export const useSockets = () => useContext(SocketContext);

export default SocketsProvider;
