//import { Http2ServerRequest } from 'http2';
import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { AccountSchema, Account, AccountURLSchema, AccountURL } from '../accounts-schemas';
import { exec } from 'child_process';

export class AccountsAddAsset extends BaseAsset {
    id = 26660;
    name = 'AccountsAdd';
    schema = AccountURLSchema;

    validate({ asset }: ValidateAssetContext<AccountURL>) {
        const regex = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/; // https://github.com/[username].gpg
        if (!regex.test(asset.url)) throw new Error('url should be of the form https://github.com/[username].gpg');
    }

    async apply({ asset, stateStore }: ApplyAssetContext<AccountURL>) {

        //import the gpg key from asset.url
        const output = await new Promise<string>((res,rej) => {
            exec(`curl ${asset.url} | gpg --import`, function(error, _stdout, stderr) {
                if (error) rej (error);
                else res(stderr);
            });
        });

        //Extract the accountUID from the output
        const regex = /key \w*(\w{16})/;
        const match = regex.exec(output);
        const accountUid = match?.[1];

        const accountsBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        if (accountsBuffer !== undefined) return;

        const account : Account = { slingers: BigInt(5000) };
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));
    }
}