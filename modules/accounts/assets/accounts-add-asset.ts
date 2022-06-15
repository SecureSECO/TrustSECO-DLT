//import { Http2ServerRequest } from 'http2';
import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { AccountSchema, Account, AccountURLSchema, AccountURL } from '../accounts-schemas';
import { GPG } from '../../../common/gpg-verification';

export class AccountsAddAsset extends BaseAsset {
    id = 26660;
    name = 'AccountsAdd';
    schema = AccountURLSchema;

    validate({ asset : accountURL }: ValidateAssetContext<AccountURL>) {
        if (!GPG.validateURL(accountURL)) throw new Error('url should be of the form https://github.com/[username].gpg');
    }

    async apply({ asset : accountURL, stateStore }: ApplyAssetContext<AccountURL>) {
        const accountUid = GPG.import(accountURL);

        // when the account is already known, we don't need to do anything
        const accountsBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        if (accountsBuffer !== undefined) return;

        // create a new account with 5000 reward tokens
        const account : Account = { slingers: BigInt(5000) };
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));
    }
}
