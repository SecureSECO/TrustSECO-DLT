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
        //const { exec } = require("child_process");

        const output = await new Promise<string>((res,rej) => {
            exec(`curl ${asset.url} | gpg --import`, function(error, stdout) {
                if (error) rej (error)
                else res(stdout);
            });
        })

        console.log("output: " + output);
        const parse1 = output.split('\n');
        console.log("jemoeder");
        console.log("parse1[4]: " + parse1[4]);

        // and get UID for this gpg key        
        
        const accountUid = 'test-account';

        const accountsBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        if (accountsBuffer !== undefined) return;

        const account : Account = { slingers: BigInt(0) };
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));
    }
}
