import { useSockets } from './context/socket.context';
import Room from './features/Room';
import Chat from './features/Chat';
import Login from './features/Login';
import { Sidebar } from 'flowbite-react';

function App() {
    const { username } = useSockets();

    return (
        <>
            {!username && <Login />}
            {username && (
                <div className="flex h-screen">
                    <Room />
                    <Chat />
                </div>
            )}
        </>
    );
}

export default App;
