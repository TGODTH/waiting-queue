// TODO: build project
const { createServer } = require("http");
const { Server } = require("socket.io");
const sql = require("mssql");
const { fetchQueue } = require("./utils.js")
const fs = require('fs');

const filePath = './settings.txt';

// TODO: Add error handler when read file
const settingsFile = fs.readFileSync(filePath, 'utf8');
const lines = settingsFile.split('\n');

const settings = {};

lines.forEach(line => {
    const [key, value] = line.split('=');
    settings[key] = value.trim();
});

const config = {
    user: settings.user,
    password: settings.password,
    server: settings.server,
    database: settings.database,
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },
};

let queueList
// TODO: Add error handler wehn connect database
sql.connect(config).then(async () => {
    queueList = await fetchQueue(sql)
});

const httpServer = createServer();
// TODO: Cors
const io = new Server(httpServer, { cors: {} });

// TODO: Add log
io.on("connection", (socket) => {
    socket.on("set clinicName", (clinicName) => {
        if (!clinicName) return
        console.log(socket.id, "join", clinicName.toUpperCase());
        socket.join(clinicName.toUpperCase());
        socket.emit("queues updated", queueList ? JSON.stringify((queueList.find((queue) => queue.clinicName.toUpperCase() === clinicName.toUpperCase()
        )).queueList) : null)
    });
    socket.on('disconnect', () => {
        console.log(socket.id, 'disconnected');
    });
});


setInterval(async () => {
    const latestQueueList = await fetchQueue(sql)
    const clinicList = [...new Set(queueList.map(clinic => clinic.clinicName, latestQueueList.map(clinic => clinic.clinicName)))]

    clinicList.forEach((clinicName) => {
        const latestClinicQueue = latestQueueList.find((queue) => queue.clinicName === clinicName)
        const clinicQueue = queueList.find((queue) => queue.clinicName === clinicName)
        if (latestClinicQueue && clinicQueue) {
            if (latestClinicQueue.queueList.every((queue, index) => queue.VN === clinicQueue.queueList[index].VN)) {
                return
            }
        }
        console.log(`queues of ${clinicName} is changed`)
        io.to(clinicName.toUpperCase()).emit('queues updated', JSON.stringify(latestClinicQueue.queueList));
        queueList = latestQueueList
    })

}, settings.query_delay);

// TODO: Add error handler when port is used
httpServer.listen(settings.port);

