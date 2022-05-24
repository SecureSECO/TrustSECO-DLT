import { Schema } from "lisk-sdk";

export const validFacts = {
    github: ["stars", "forks", "issues"],
    libraries_io: ["sourcerank"]
}

////////////////
// INTERFACES //
////////////////

export interface CodaReturnJob extends Record<string, unknown> {
    packageName: string;
    packagePlatform: string;
    packageOwner: string;
    packageRelease: string;
    fact: string;
    jobID: number;
}

export interface CodaJob extends Record<string, unknown> {
    package: string;
    version: string;
    fact: string;
    date: string;
    jobID: number;
}

export interface CodaJobList extends Record<string, unknown> {
    jobs: CodaJob[];
}

/////////////
// SCHEMAS //
/////////////

export const codaJobSchema: Schema = {
    $id: 'coda/add-job',
    type: 'object',
    required: ["package", "version", "fact", "date", "jobID"],
    properties: {
        // package of the trustfact (e.g. "microsoft/terminal")
        package: {
            dataType: 'string',
            fieldNumber: 1
        },
        // The version of the package this trustfact applies to
        version: {
            dataType: 'string',
            fieldNumber: 2
        },
        // the type of fact (e.g. "stars")
        fact: {
            dataType: 'string',
            fieldNumber: 3
        },
        date: {
            dataType: 'string',
            fieldNumber: 4
        },
        jobID: {
            dataType: 'uint32',
            fieldNumber: 5
        }
    }
};

export const codaReturnJobSchema: Schema = {
    $id: 'coda/return-job',
    type: 'object',
    required: [],
    properties: {
        // ID name of package
        packageName: {
            dataType: 'string',
            fieldNumber: 1
        },
        // Platform the package is hosted on (e.g. GitHub)
        packagePlatform: {
            dataType: 'string',
            fieldNumber: 2
        },
        // Owner (account name) of the package on the platform
        packageOwner: {
            dataType: 'string',
            fieldNumber: 3
        },
        // Release version 
        packageRelease: {
            dataType: 'string',
            fieldNumber: 4            
        },
        // The ID corresponding to the job
        jobID: {
            dataType: 'uint32',
            fieldNumber: 5
        }
    }
}


export const codaJobListSchema: Schema = {
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