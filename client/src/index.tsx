import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import SocketsProvider from './context/socket.context';
import './index.css';

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement,
);
root.render(
    <SocketsProvider>
        <App />
    </SocketsProvider>,
);
