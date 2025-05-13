import { Schema, Modules } from "klayr-sdk";

/** Key used to access the keys, needed because klayr data storage is key-value based */
export const keyIndex = Buffer.alloc(0);

export interface Keys {
    keys: {key: string} [];
}

export const KeySchema: Schema = {
    $id: "accounts/key",
    type: "object",
    required: ["key"],
    properties: {
        key: {
            dataType: "string",
            fieldNumber: 1
        }
    }
};

export const KeysSchema: Schema = {
    $id: "accounts/keys",
    type: "object",
    required: ["keys"],
    properties: {
        keys: {
            type: "array",
            fieldNumber: 1,
            items: KeySchema
        }
    }
};

export class KeysStore extends Modules.BaseStore<Keys> {
    public schema = KeysSchema;
}