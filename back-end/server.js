import 'dotenv/config'
import express, { static as expressStatic } from "express";
import { createServer as createHTTPServer } from "http";
import { createServer as createHTTPSServer } from "https";
import { Server } from "socket.io";
import { fetchQueue } from "./utils.js";
import lodash from "lodash";
import { join } from "path";
import { readFileSync } from "fs";

const USER = process.env.USER;
const PASSWORD = process.env.PASSWORD;
const SERVER = process.env.SERVER;
const DATABASE = process.env.DATABASE;
const PORT = process.env.PORT;
const QUERY_DELAY = process.env.QUERY_DELAY;
const CLINIC_PREFIX = process.env.CLINIC_PREFIX;
const HTTPS_KEY = process.env.HTTPS_KEY;
const HTTPS_CERT = process.env.HTTPS_CERT;
const HTTPS_CA = process.env.HTTPS_CA;

if (
    !USER ||
    !PASSWORD ||
    !SERVER ||
    !DATABASE ||
    !PORT ||
    !QUERY_DELAY ||
    !CLINIC_PREFIX ||
    !HTTPS_KEY ||
    !HTTPS_CERT ||
    !HTTPS_CA
) {
    console.log(SERVER)
    console.log(DATABASE)
    console.log(PORT)
    console.log(QUERY_DELAY)
    console.log(CLINIC_PREFIX)
    console.log(HTTPS_KEY)
    console.log(HTTPS_CERT)
    console.log(HTTPS_CA)
    console.error("Error: Invalid settings in .env");
    process.exit();
}

const app = express();
let httpsServer
try {
    httpsServer = createHTTPSServer(
        {
            cert: readFileSync(HTTPS_CERT, "utf-8"),
            key: readFileSync(HTTPS_KEY, "utf-8"),
            ca: readFileSync(HTTPS_CA, "utf-8"),
        },
        app
    );
} catch (error) {
    console.log("Failed to get HTTPS cert file... Serve as HTTP instead");
    httpsServer = createHTTPServer(app);
}

if (!httpsServer) throw new Error("Failed to create HTTP/HTTPS server")

let queueList = {}

const io = new Server(httpsServer, { cors: {} });

io.on("connection", (socket) => {
    socket.on("set clinicName", async (clinicName) => {
        if (!clinicName) return
        let roomName = CLINIC_PREFIX + clinicName.toUpperCase()
        socket.join(roomName);
        if (!queueList[roomName]) {
            try {
                queueList[roomName] = await fetchQueue(clinicName.toUpperCase())
            } catch (err) {
                console.log("Failed to query:", err)
            }
        }

        socket.emit("queues updated", queueList[roomName])
    });
});

let autoFetchs = {}

io.of("/").adapter.on("create-room", (roomName) => {
    if (!roomName.includes(CLINIC_PREFIX)) return
    autoFetchs[roomName] = setInterval(async () => {
        let latestQueueList
        try {
            latestQueueList = await fetchQueue(roomName.replace(CLINIC_PREFIX, ''))
        } catch (err) {
            console.log("Failed to query:", err)
        }
        if (latestQueueList && queueList[roomName]) {
            const clinicQueue = queueList[roomName]
            if (latestQueueList.queues.every((queue, index) => lodash.isEqual(queue, clinicQueue.queues[index])) && latestQueueList.docters.every((docter, index) => lodash.isEqual(docter, clinicQueue.docters[index])) && (clinicQueue.queues.length == latestQueueList.queues.length) && (clinicQueue.docters.length == latestQueueList.docters.length)) {
                return
            }
        }

        const updatedQueue = latestQueueList
        io.to(roomName).emit('queues updated', updatedQueue);
        queueList[roomName] = updatedQueue

    }, QUERY_DELAY)
});

io.of("/").adapter.on("delete-room", (roomName) => {
    clearInterval(autoFetchs[roomName])
    delete queueList[roomName]
});

app.use(expressStatic("build"))

app.use('*', function (req, res) {
    res.sendFile(join(__dirname, '/build/index.html'));
});

httpsServer.listen(PORT);
console.log("clinic queue server started at port " + PORT)


