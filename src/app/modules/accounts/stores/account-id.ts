import { Schema, BaseStore } from "klayr-sdk";

export interface AccountId {
    uid: string;
}

export const AccountIdSchema: Schema = {
    $id: "accounts/new-account",
    type: "object",
    required: ["uid"],
    properties: {
        uid: {
            dataType: "string",
            fieldNumber: 1
        }
    }
};

export class AccountIdStore extends BaseStore<AccountId> {
    public schema = AccountIdSchema;
}
