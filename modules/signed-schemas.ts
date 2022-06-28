import { Schema } from "lisk-sdk";

export interface Signed<T extends object> {
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

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/