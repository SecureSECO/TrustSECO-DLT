import { Schema } from "lisk-sdk";

export const validFacts = {
    github: ["stars", "forks", "issues"],
    libraries_io: ["sourcerank"]
}


////////////////
// INTERFACES //
////////////////

export interface CodaJob extends Record<string,unknown> {
    package: string;
    source: string;
    fact: string;
}

export interface CodaJobList extends Record<string,unknown> {
    jobs: CodaJob[];
}


/////////////
// SCHEMAS //
/////////////

export const codaJobSchema : Schema = {
    $id: 'coda/add-job',
    type: 'object',
    required: ["package", "source", "fact"],
    properties: {
        // package of the trustfact (e.g. "microsoft/terminal")
        package: {
            dataType: 'string',
            fieldNumber: 1
        },
        // source for the fact (e.g. "github")
        source: {
            dataType: 'string',
            fieldNumber: 2
        },
        // the type of fact (e.g. "stars")
        fact: {
            dataType: 'string',
            fieldNumber: 3
        }
    }
};


export const codaJobListSchema : Schema = {
    $id: 'coda/job-list',
    type: 'object',
    required: ["jobs"],
    properties: {
        jobs: {
            type: 'array',
            fieldNumber: 1,
            items: codaJobSchema
        }
    }
}
