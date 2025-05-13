import { Schema, Modules } from "klayr-sdk";

export interface AccountURL {
    url: string;
}

export const AccountURLSchema: Schema = {
    $id: "accounts/account-url",
    type: "object",
    required: ["url"],
    properties: {
        url: {
            dataType: "string",
            fieldNumber: 1
        }
    }
};

export class AccountUrlStore extends Modules.BaseStore<AccountURL> {
    public schema = AccountURLSchema;
}
