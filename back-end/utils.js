function categorizeQueueList(queueList) {
    const clinics = [...new Set(queueList.map(queue => queue.clinic))]
    return clinics.reduce((acc, clinic) => {
        const _queueList = queueList.filter(queue => queue.clinic === clinic)
        return [...acc, { clinicName: clinic, queueList: _queueList }]
    }, [])
}

async function fetchQueue(sql) {
    // TODO: Add error handler when query
    return categorizeQueueList((await sql.query`
    SELECT [mso].[dbo].[VNPresQ_Doctortime_Test].[Clinic] as [clinic]
    ,[mso].[dbo].[VNPresQ_Doctortime_Test].[DoctorName] as [docter]
    ,[time1] as [time]
    ,[Vn] as [VN]
    ,[Ack] as [Ack]
    ,[RunNo] as [RunNo]
    ,[X/L] as [XL]
  FROM [mso].[dbo].[VNPresQ_Wait] RIGHT JOIN [mso].[dbo].[VNPresQ_Doctortime_Test]
  ON [mso].[dbo].[VNPresQ_Wait].[Doctor] = [mso].[dbo].[VNPresQ_Doctortime_Test].[doctor]
  ORDER BY [mso].[dbo].[VNPresQ_Doctortime_Test].[Clinic], [dbo].[VNPresQ_Doctortime_Test].[OrderD], [mso].[dbo].[VNPresQ_Doctortime_Test].[doctor], [Ack], [RunNo]
  `).recordset);
}

module.exports = { fetchQueue }