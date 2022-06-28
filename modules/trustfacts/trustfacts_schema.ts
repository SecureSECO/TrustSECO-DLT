import { Schema } from "lisk-sdk";
import { AccountId, AccountIdSchema } from "../accounts/accounts-schemas";

export interface AddTrustFact extends Record<string, unknown> {
    jobID: number,
    factData: string,
}

export interface StoreTrustFact extends Record<string, unknown> {
    fact: string,
    factData: string,
    version: string,
    jobID: number,
    account: AccountId
}

export interface TrustFactList extends Record<string, unknown> {
    facts: StoreTrustFact[];
}

export const AddTrustFactSchema: Schema = {
    $id: 'trustfacts/add-facts',
    type: 'object',
    required: ["jobID", "factData"],
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
        }
    }
}

export const StoreTrustFactSchema: Schema = {
    $id: 'trustfacts/store-facts',
    type: 'object',
    required: ["fact", "factData", "version", "jobID", "account"],
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
        // ID of job in CODA
        jobID: {
            dataType: 'uint32',
            fieldNumber: 5
        },
        // The account that sent in the fact
        account: {
            ...AccountIdSchema,
            fieldNumber: 6
        }
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

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/