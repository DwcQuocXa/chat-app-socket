import React from 'react';
import { useRef } from 'react';
import { useSockets } from '../context/socket.context';
import { Label, TextInput, Button, Card } from 'flowbite-react';

function Login() {
    const { setUsername, setLocation } = useSockets();
    const usernameRef = useRef<any>(null);
    const locationRef = useRef<any>(null);

    function handleSetUsername() {
        const userNameInput = usernameRef.current.value;
        const locationInput = locationRef.current.value;
        if (!userNameInput || !locationInput) {
            return;
        }

        setUsername(userNameInput);
        setLocation(locationInput);
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <form>
                <Card>
                    <div className="col-span-1">
                        <div className="mb-2 block flex flex-row items-center">
                            <Label htmlFor={'Username'} value={'Username'} />
                        </div>
                        <TextInput
                            id="Username"
                            placeholder="Username"
                            ref={usernameRef}
                            required={true}
                        />
                    </div>
                    <div className="col-span-1">
                        <div className="mb-2 block flex flex-row items-center">
                            <Label htmlFor={'Location'} value={'Location'} />
                        </div>
                        <TextInput
                            id="Location"
                            placeholder="Location"
                            ref={locationRef}
                            required={true}
                        />
                    </div>
                    <Button type="submit" onClick={handleSetUsername}>
                        START
                    </Button>
                </Card>
            </form>
        </div>
    );
}

export default Login;
