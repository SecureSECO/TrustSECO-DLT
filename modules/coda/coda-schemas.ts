
export const codaJobSchema = {
    $id: 'coda/add-job',
    type: 'object',
    required: ["package", "source", "fact"],
    properties: {
        // package of the trustfact (e.g. "microsoft/terminal")
        package: {
            dataType: 'string',
            fieldNumber: 1
        },
        // source for the fact (e.g. "github") // moet weg
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
}

export const codaJobListSchema = {
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

export const validFacts = {
    "github" : ["stars", "forks", "issues"],
    "libraries.io" : ["sourcerank"]
}