
export const codaJobsSchema = {
    $id: "lisk/hello/counter",
    type: "object",
    required: ["helloCounter"],
    properties: {
        helloCounter: {
            dataType: "uint32",
            fieldNumber: 1,
        },
    },
};

export const helloAssetSchema = {
    $id: "lisk/hello/asset",
    type: "object",
    required: ["helloString"],
    properties: {
        helloString: {
            dataType: "string",
            fieldNumber: 1,
        },
    },
};

export const validFacts = {
    "github" : ["stars", "forks", "issues"],
    "libraries.io" : ["sourcerank"]
}