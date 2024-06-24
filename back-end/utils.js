import sql from "mssql";

const dbConfig = {
    user: process.env.USER,
    password: process.env.PASSWORD,
    server: process.env.SERVER,
    database: process.env.DATABASE,
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
    },
};

sql.connect(dbConfig).then(() => {
    console.log("Database connection: OK");
}).catch((err) => {
    console.error("Error connecting to the database:", err);
});

async function queryClinic(clinicName, procedure_name) {
    return await sql.connect(dbConfig)
        .then((pool) => {
            return pool
                .request()
                .input("Clinic", sql.VarChar, clinicName)
                .execute(procedure_name);
        })
        .then((result) => {
            return result.recordset;
        })
        .catch((err) => {
            throw err;
        });
}

async function fetchQueue(clinicName) {
    let docters = await queryClinic(clinicName, "spVNPresQ_Doctortime_Test");
    let queues = await queryClinic(clinicName, "spVNPresQ_Wait");

    return { docters: docters, queues: queues };
}

export { fetchQueue };
