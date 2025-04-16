import { codec, Schema } from 'lisk-sdk';
import { Signed } from './signed-schemas';
import axios from 'axios';
import * as openpgp from 'openpgp';

export interface ImportResult {
    uid: string,
    key: string
}

export class GPG {
    /** all GPG key URLs should be provided by github.com */
    static readonly urlPattern = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/;

    static validateURL = (url: string) => this.urlPattern.test(url);

    /** import a GPG key from a URL
     * returns the account UID, and a string containing the armored key */
    static async import(url: string): Promise<ImportResult> {
        const match = url.match(this.urlPattern);
        if (!match) throw new Error(`Url ${url} is not a GitHub GPG link`);
        const { data } = await axios.get(url);
        const key = await openpgp.readKey({ armoredKey: data });
        const accountUid = key.getKeyID().toHex().toUpperCase();
        if (accountUid === undefined) throw new Error(`Unable to find the uid for the GPG key from ${url}`);
        return {uid: accountUid, key: data};
    }

    /** verify the signature of a signed object
    * returns the account UID of the key used to sign the object 
    * Throws error on invalid signature */
    static async verify<T extends object>(asset: Signed<T>, schema: Schema, keys: string[]): Promise<string> {
        const encoded = codec.encode(schema, asset.data).toString('hex');
        const parsedKeys = await this.readKeys(keys);
        const signature = await openpgp.readSignature({ armoredSignature: asset.signature });
        const verificationResult = await openpgp.verify({
            message: await openpgp.createMessage({ text: encoded }),
            signature,
            verificationKeys: parsedKeys
        })
        const { verified, keyID } = verificationResult.signatures[0];

        try {
            await verified;
        }
        catch {
            if (process.env.ACCEPT_BAD_SIGNATURES) console.error("GPG signature verification failed! ACCEPT_BAD_SIGNATURES is set, so continuing anyway.");
            else throw new Error("GPG signature verification failed");
        }
        const accountUid = keyID.toHex().toUpperCase();
        if (accountUid === undefined) {
            if (process.env.ACCEPT_INVALID_ACCOUNT) {
                console.error("Unable to find the uid for the provided GPG key! ACCEPT_INVALID_ACCOUNT is set, so continuing anyway with throwaway account");
                return "throwaway";
            }
            else throw new Error("Unable to find the uid for the provided GPG key");
        }
        return accountUid;
    }

    /** Read all the pgp files from the argument and parse them */
    private static async readKeys(keys: string[]): Promise<openpgp.Key[]> {
        const parsedKeys: openpgp.Key[] = [];
        for (const key of keys) {
            try {
                parsedKeys.push(await openpgp.readKey({ armoredKey: key }))
            }
            catch {
                console.log(`Failed to import key ${key}`)
            }
        }
        return parsedKeys;
    }
}