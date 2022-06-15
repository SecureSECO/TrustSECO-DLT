import { exec, spawnSync } from "child_process";
import { promisify } from 'util';
import { codec, Schema } from 'lisk-sdk';
import { writeFileSync } from 'fs';
import { unlink } from 'fs/promises';
import { Signed } from '../modules/signed-schemas';
const exec$ = promisify(exec);

export class GPG {

    // all GPG key URLs should be provided by github.com
    static readonly urlPattern = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/;

    static validateURL = ( url: string ) => this.urlPattern.test(url);

    // import a GPG key from a URL to the local GPG keyring
    // returns the account UID of the imported key
    static async import( url: string ) : Promise<string> {
        this.validateURL( url );

        const { stderr } = await exec$(`curl ${url} | gpg --import`);
        const accountUid = /key \w*(\w{16})/.exec(stderr)?.[1];
        if (accountUid === undefined) throw new Error(`Unable to find the uid for the GPG key from ${url}`);

        return accountUid;
    }

    // verify the signature of a signed object
    // returns the account UID of the key used to sign the object
    static verify<T extends object>(asset : Signed<T>, schema : Schema) : string {
        const encoded = codec.encode(schema, asset.data).toString('hex');

        const random = Math.random().toString().slice(2);
        writeFileSync("/tmp/signature-" + random, asset.signature);
        writeFileSync("/tmp/data-" + random, encoded);
        const { stderr, status } = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);
        unlink("/tmp/signature-" + random);
        unlink("/tmp/data-" + random);

        const accountUid = /key \w*(\w{16})/.exec(stderr.toString())?.[1];
        if (status !== 0) throw new Error("GPG signature verification failed");
        if (accountUid === undefined) throw new Error("GPG key is unknown");

        return accountUid;
    }
}