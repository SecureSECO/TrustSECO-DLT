import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { AccountSchema, Account, AccountURLSchema, AccountURL } from '../accounts-schemas';

export class AccountsAddAsset extends BaseAsset {
    id = 26660;
    name = 'AccountsAdd';
    schema = AccountURLSchema;

    validate({ asset }: ValidateAssetContext<AccountURL>) {
        const regex = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/; // https://github.com/[username].gpg
        if (!regex.test(asset.url)) throw new Error('url should be of the form https://github.com/[username].gpg');
    }

    async apply({ asset, stateStore }: ApplyAssetContext<AccountURL>) {

        /* todo; import the gpg key from: */ asset.url;
        // and get UID for this gpg key
        const accountUid = 'test-account';

        const accountsBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        if (accountsBuffer !== undefined) return;

        const account : Account = { slingers: BigInt(0) };
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));
    }
}
