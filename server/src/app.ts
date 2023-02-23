import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import config from "config";

import socket from "./socket";

const port = config.get<number>("port");
const corsOrigin = config.get<string>("corsOrigin");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true,
    },
});

app.get("/", (_, res) =>
    res.send(`Server is up and running`)
);

httpServer.listen(port, () => {
    console.log(`server running on port ${port}`);

    socket({ io });
});
