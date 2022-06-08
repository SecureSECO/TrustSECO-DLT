
import { Schema } from "lisk-sdk";

export interface Account extends Record<string, unknown> {
    slingers: bigint;
}

export interface AccountId extends Record<string, unknown> {
    uid: string;
}

export interface AccountURL extends Record<string, unknown> {
    url: string;
}

export const AccountSchema: Schema = {
    $id: "accounts/account",
    type: "object",
    required: ["slingers"],
    properties: {
        slingers: {
            dataType: "uint64",
            fieldNumber: 2
        }
    }
};

export const AccountIdSchema: Schema = {
    $id: "accounts/new-account",
    type: "object",
    required: ["uid"],
    properties: {
        uid: {
            type: "string",
            fieldNumber: 1
        }
    }
};

export const AccountURLSchema: Schema = {
    $id: "accounts/account-url",
    type: "object",
    required: ["url"],
    properties: {
        url: {
            type: "string",
            fieldNumber: 1
        }
    }
};