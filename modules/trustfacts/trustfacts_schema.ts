export const TrustFactsSchema = {
    $id: 'trustfacts/add-facts',
    type: 'object',
    required: [],
    properties: {
        // ID of job in CODA
        jobID: {
            dataType: 'uint32',
            fieldNumber: 1
        },
        // the data that was spidered
        factData: {
            dataType: 'string',
            fieldNumber: 2
        },
        // Git signature and gpgkey
        gitSignature: {
            dataType: 'string',
            fieldNumber: 3
        },
        keyURL: {
            dataType: 'string',
            fieldNumber: 4
        }
    }
}

export const trustFactsListSchema = {
    $id: 'trustfacts/facts-list',
    type: 'object',
    required: ["facts"],
    properties: {
        facts: {
            type: 'array',
            fieldNumber: 1,
            items: TrustFactsSchema
        }
    }
}

