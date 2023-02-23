import React, { useRef } from 'react';
import { useSockets } from '../context/socket.context';
import { events } from '../../../common/config/events';
import { Button, Label, TextInput } from 'flowbite-react';

function Room() {
    const { socket, roomId, rooms, username, location } = useSockets();
    const newRoomRef = useRef<any>(null);

    function handleCreateRoom() {
        //get the room name
        const newRoomName = newRoomRef.current.value || '';

        if (!String(newRoomName).trim()) {
            return;
        }

        // emit room created event
        socket.emit(
            events.CLIENT.CREATE_ROOM,
            username,
            location,
            roomId,
            newRoomName,
        );

        // set room name input to empty string
        newRoomRef.current.value = '';
    }

    function handleJoinRoom(key: string) {
        if (key === roomId) {
            return;
        }

        socket.emit(events.CLIENT.JOIN_ROOM, roomId, key, username, location);
    }
    return (
        <div className="h-screen w-64 border-r-2 p-4">
            <div>
                <div className="col-span-1 pt-4">
                    <div className="mb-2 block flex flex-row items-center">
                        <Label htmlFor={'Room name'} value={'Room name'} />
                    </div>
                    <TextInput
                        id="Room name"
                        type="Room name"
                        placeholder="Room name"
                        ref={newRoomRef}
                        required={true}
                    />
                </div>
                <Button className="mt-4" onClick={handleCreateRoom}>
                    CREATE ROOM
                </Button>
            </div>

            <ul>
                {Object.keys(rooms).map((key) => {
                    return (
                        <div key={key} className=" pt-4">
                            <Button
                                disabled={key === roomId}
                                title={`Join ${rooms[key].name}`}
                                onClick={() => handleJoinRoom(key)}
                                className="w-full"
                                color="success"
                            >
                                {rooms[key].name}
                            </Button>
                        </div>
                    );
                })}
            </ul>
        </div>
    );
}

export default Room;
