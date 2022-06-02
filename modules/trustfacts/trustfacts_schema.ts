import { Schema } from "lisk-sdk";

export interface AddTrustFact extends Record<string, unknown> {
    jobID: number,
    factData: string,
    gitSignature: string,
    keyURL: string,
}

export interface StoreTrustFact extends Record<string, unknown> {
    fact: string,
    factData: string,
    version: string,
    keyURL: string,
    jobID: number,
}

export interface TrustFactList extends Record<string, unknown> {
    facts: StoreTrustFact[];
}

export const AddTrustFactSchema: Schema = {
    $id: 'trustfacts/add-facts',
    type: 'object',
    required: ["jobID", "factData", "gitSignature", "keyURL"],
    properties: {
        // ID of job in CODA
        jobID: {
            dataType: 'uint32',
            fieldNumber: 1
        },
        // The data that was spidered
        factData: {
            dataType: 'string',
            fieldNumber: 2
        },
        // Git signature and gpgkey
        gitSignature: {
            dataType: 'string',
            fieldNumber: 3
        },
        // URL to the user gpgkey
        keyURL: {
            dataType: 'string',
            fieldNumber: 4
        }
    }
}

export const StoreTrustFactSchema: Schema = {
    $id: 'trustfacts/add-facts',
    type: 'object',
    required: ["fact", "factData", "version", "keyURL"],
    properties: {
        // the fact that was spidered
        fact: {
            dataType: 'string',
            fieldNumber: 1
        },
        // The data that was spidered
        factData: {
            dataType: 'string',
            fieldNumber: 2
        },
        // The version of the package the trustfact was gathered for
        version: {
            dataType: 'string',
            fieldNumber: 3
        },
        // URL to the user gpgkey
        keyURL: {
            dataType: 'string',
            fieldNumber: 4
        },
        // ID of job in CODA
        jobID: {
            dataType: 'uint32',
            fieldNumber: 5
        },
    }
}

export const TrustFactListSchema: Schema = {
    $id: 'trustfacts/facts-list',
    type: 'object',
    required: ["facts"],
    properties: {
        facts: {
            type: 'array',
            fieldNumber: 1,
            items: StoreTrustFactSchema
        }
    }
}

