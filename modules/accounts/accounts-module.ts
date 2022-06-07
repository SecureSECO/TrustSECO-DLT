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
        getAccount: async ({ url }: Record<string, unknown>) => {
            const accountBuffer = await this._dataAccess.getChainState("account:" + url) as Buffer;
            return codec.decode<Account>(AccountSchema, accountBuffer);
        }
    }

    // todo; remove test-account
    async afterGenesisBlockApply({ stateStore }) {
        const account: Account = { slingers: BigInt(10000000) };
        const accountBuffer = codec.encode(AccountSchema, account);
        await stateStore.chain.set("account:test-account", accountBuffer);
    }
}
