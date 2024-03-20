const sql = require("mssql");
const fs = require('fs');

let settings = {};

try {
    const filePath = './settings.txt';

    const settingsFile = fs.readFileSync(filePath, 'utf8');
    const lines = settingsFile.split('\n');


    lines.forEach(line => {
        const [key, value] = line.split('=');
        settings[key] = value.trim();
    });
} catch (err) {
    console.log("Failed to read settings.txt:", err)
}

const dbConfig = {
    user: settings.user,
    password: settings.password,
    server: settings.server,
    database: settings.database,
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },
};

async function queryClinic(clinicName, procedure_name) {
    return await sql.connect(dbConfig).then(pool => {
        return pool.request()
            .input('Clinic', sql.VarChar, clinicName)
            .execute(procedure_name)
    }).then(result => {
        return result.recordset
    }).catch(err => {
        throw err
    });
}



async function fetchQueue(clinicName) {
    let docters = await queryClinic(clinicName, "spVNPresQ_Doctortime_Test")
    let queues = await queryClinic(clinicName, "spVNPresQ_Wait")

    return { docters: docters, queues: queues };
}


module.exports = { fetchQueue, settings }