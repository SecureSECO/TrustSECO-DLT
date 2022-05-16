import { Schema } from "lisk-sdk";



////////////////
// INTERFACES //
////////////////

export interface TrustFact extends Record<string, unknown> {
    jobID: number,
    factData: string,
    gitSignature: string,
    keyURL: string,
}

export interface TrustFactList extends Record<string, unknown> {
    facts: TrustFact[];
}



/////////////
// SCHEMAS //
/////////////

export const TrustFactSchema : Schema = {
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

export const TrustFactListSchema : Schema = {
    $id: 'trustfacts/facts-list',
    type: 'object',
    required: ["facts"],
    properties: {
        facts: {
            type: 'array',
            fieldNumber: 1,
            items: TrustFactSchema
        }
    }
}

