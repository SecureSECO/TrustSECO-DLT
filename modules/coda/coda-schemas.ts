import { Schema } from "lisk-sdk";

export const validFacts: any = {
    github: [
        "gh_contributor_count",
        "gh_user_count",
        "gh_total_download_count",
        "gh_release_download_count",
        "gh_yearly_commit_count",
        "gh_repository_language",
        "gh_gitstar_ranking",
        "gh_open_issues_count",
        "gh_zero_response_issues_count",
        "gh_release_issues_count",
        "gh_issue_ratio",
        "gh_average_resolution_time",
        "gh_owner_stargazer_count"
    ],
    libraries_io: [
        "lib_release_frequency",
        "lib_contributor_count",
        "lib_dependency_count",
        "lib_dependent_count",
        "lib_latest_release_date",
        "lib_first_release_date",
        "lib_release_count",
        "lib_sourcerank"
    ],
    cve: [
        "cve_count",
        "cve_vulnerabilities",
        "cve_codes"
    ],
    stackoverflow: [
        "so_popularity"
    ]
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

export interface MinimalCodaJob extends Record<string, unknown> {
    package: string;
    version: string;
    fact: string;
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

export const minimalCodaJobSchema: Schema = {
    $id: 'coda/add-minimal-job',
    type: 'object',
    required: ["package", "version", "fact"],
    properties: {
        package: {
            dataType: 'string',
            fieldNumber: 1
        },
        version: {
            dataType: 'string',
            fieldNumber: 2
        },
        fact: {
            dataType: 'string',
            fieldNumber: 3
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