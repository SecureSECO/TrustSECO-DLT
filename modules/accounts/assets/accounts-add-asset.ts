import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { AccountSchema, Account, AccountURLSchema, AccountURL } from '../accounts-schemas';
import { GPG } from '../../../common/gpg-verification';

export class AccountsAddAsset extends BaseAsset {
    id = 26660;
    name = 'AccountsAdd';
    schema = AccountURLSchema;

    validate({ asset : { url } }: ValidateAssetContext<AccountURL>) {
        if (!GPG.validateURL(url)) throw new Error('url should be of the form https://github.com/[username].gpg');
    }

    async apply({ asset : { url }, stateStore }: ApplyAssetContext<AccountURL>) {
        console.log(`Adding GPG key from ${url}`);

        const uid = await GPG.import( url );

        // when the account is already known, we don't need to do anything
        const accountsBuffer = await stateStore.chain.get("account:" + uid);
        if (accountsBuffer !== undefined) {
            console.log(`Account from ${url} already known as ${uid}`);
            return;
        }

        // create a new account with 500000 reward tokens
        const account : Account = { slingers: BigInt(500000) };
        await stateStore.chain.set("account:" + uid, codec.encode(AccountSchema, account));

        console.log(`Added account ${uid} from ${url}`);
    }
}

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/