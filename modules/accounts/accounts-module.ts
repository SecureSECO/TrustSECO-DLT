import { BaseModule, codec } from 'lisk-sdk';
import { Account, AccountSchema } from './accounts-schemas';
import { AccountsAddAsset } from './assets/accounts-add-asset';

export class AccountsModule extends BaseModule {
    id = 2226;
    name = "accounts";
    transactionAssets = [
        new AccountsAddAsset()
    ];
    actions = {
        getAccount: async ({ uid }: Record<string, unknown>) => {
            const accountBuffer = await this._dataAccess.getChainState("account:" + uid);
            if (accountBuffer === undefined) return [];
            const account = codec.decode<Account>(AccountSchema, accountBuffer);
            return { ...account,  slingers: account.slingers.toString() };
        }
    }
}

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/