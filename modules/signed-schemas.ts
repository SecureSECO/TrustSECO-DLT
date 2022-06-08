import { Schema } from "lisk-sdk";

export interface Signed<T> {
    signature: string;
    data: T;
}

export const SignedSchema = (schema: Schema) : Schema => ({
    $id: schema.$id + "/signed",
    type: 'object',
    required: ["signature", "data"],
    properties: {
        signature: {
            dataType: 'string',
            fieldNumber: 1
        },
        data: {
            ...schema,
            fieldNumber: 2
        }
    }
});
