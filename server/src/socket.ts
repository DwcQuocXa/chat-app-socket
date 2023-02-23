import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import { events } from '../../common/config/events';

const rooms: Record<string, { name: string }> = {};

function socket({ io }: { io: Server }) {
    console.log(`Sockets enabled`);

    io.on(events.CONNECTION, (socket: Socket) => {
        console.log(`User connected ${socket.id}`);

        socket.emit(events.SERVER.ROOMS, rooms);

        /*
         * When a user creates a new room
         */
        socket.on(events.CLIENT.CREATE_ROOM, ( username,location, oldRoomId, roomName ) => {
            // create a roomId
            const roomId = uuidv4();
            // add a new room to the rooms object
            rooms[roomId] = {
                name: roomName,
            };

            //Leave the old room
            const date = new Date();
            if (rooms[oldRoomId]) {
                socket.leave(oldRoomId);
                socket.to(oldRoomId).emit(events.SERVER.ROOM_MESSAGE, {
                    message: `${username} from ${location} has left room ${rooms[oldRoomId].name}`,
                    time: `${date.getHours()}:${date.getMinutes()}`,
                });
            }

            socket.join(roomId);

            // broadcast an event saying there is a new room
            socket.broadcast.emit(events.SERVER.ROOMS, rooms);

            // emit back to the room creator with all the rooms
            socket.emit(events.SERVER.ROOMS, rooms);
            // emit event back the room creator saying they have joined a room
            socket.emit(events.SERVER.JOINED_ROOM, roomId);
        });

        /*
         * When a user sends a room message
         */

        socket.on(
            events.CLIENT.SEND_ROOM_MESSAGE,
            ({ roomId, message, username }) => {
                const date = new Date();
                console.log({ roomId, message, username });
                socket.join(roomId);

                socket.to(roomId).emit(events.SERVER.ROOM_MESSAGE, {
                    message,
                    username,
                    time: `${date.getHours()}:${date.getMinutes()}`,
                });
            },
        );

        /*
         * When a user joins a room
         */
        socket.on(
            events.CLIENT.JOIN_ROOM,
            (oldRoomId, newRoomId, username, location) => {
                const date = new Date();

                //Leave the old room and send notification
                if (rooms[oldRoomId]) {
                    socket.leave(oldRoomId);
                    socket.to(oldRoomId).emit(events.SERVER.ROOM_MESSAGE, {
                        message: `${username} from ${location} has left room ${rooms[oldRoomId].name}`,
                        time: `${date.getHours()}:${date.getMinutes()}`,
                    });
                }

                //Join the new room and send notification
                socket.join(newRoomId);
                socket.emit(events.SERVER.JOINED_ROOM, newRoomId);
                socket.to(newRoomId).emit(events.SERVER.ROOM_MESSAGE, {
                    message: `${username} from ${location} has joined ${rooms[newRoomId].name}`,
                    username: oldRoomId,
                    time: `${date.getHours()}:${date.getMinutes()}`,
                });
            },
        );
    });
}

export default socket;
