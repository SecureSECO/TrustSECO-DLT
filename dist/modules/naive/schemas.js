"use strict";
const trustFactAssetSchema = {
    $id: "lisk/hello/asset",
    type: "object",
    required: ["trustFactJSON"],
    properties: {
        trustFactJSON: {
            dataType: "string",
            fieldNumber: 1,
        },
    },
};
module.exports = {
    trustFactAssetSchema
};
//# sourceMappingURL=schemas.js.map