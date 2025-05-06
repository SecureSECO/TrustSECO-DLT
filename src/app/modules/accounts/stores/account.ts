import { Schema, BaseStore } from "klayr-sdk";

export interface Account {
    slingers: bigint;
}

export interface AccountSerial {
    slingers: string;
}

export const AccountSchemaSerial: Schema = {
    $id: "accounts/account",
    type: "object",
    required: ["slingers"],
    properties: {
        slingers: {
            dataType: "string",
            fieldNumber: 1
        }
    }
};

export const AccountSchema: Schema = {
    $id: "accounts/account",
    type: "object",
    required: ["slingers"],
    properties: {
        slingers: {
            dataType: "uint64",
            fieldNumber: 1
        }
    }
};

export class AccountStore extends BaseStore<Account> {
    public schema = AccountSchema;
}
