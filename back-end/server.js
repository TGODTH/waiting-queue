const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { fetchQueue, settings } = require("./utils.js")
const lodash = require("lodash");
const path = require("path");

let queueList = {}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: {} });

io.on("connection", (socket) => {
    socket.on("set clinicName", async (clinicName) => {
        if (!clinicName) return
        let roomName = settings.clinic_prefix + clinicName.toUpperCase()
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
    if (!roomName.includes(settings.clinic_prefix)) return
    autoFetchs[roomName] = setInterval(async () => {
        let latestQueueList
        try {
            latestQueueList = await fetchQueue(roomName.replace(settings.clinic_prefix, ''))
        } catch (err) {
            console.log("Failed to query:", err)
        }
        if (latestQueueList && queueList[roomName]) {
            const clinicQueue = queueList[roomName]
            if (latestQueueList.queues.every((queue, index) => lodash.isEqual(queue, clinicQueue.queues[index])) && latestQueueList.docters.every((docter, index) => lodash.isEqual(docter, clinicQueue.docters[index]))) {
                return
            }
        }

        const updatedQueue = latestQueueList
        io.to(roomName).emit('queues updated', updatedQueue);
        queueList[roomName] = updatedQueue

    }, settings.query_delay)
});

io.of("/").adapter.on("delete-room", (roomName) => {
    clearInterval(autoFetchs[roomName])
});

app.use(express.static("build"))

app.use('*', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

httpServer.listen(settings.port);
console.log("clinic queue server started at port " + settings.port)


