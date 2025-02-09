import { codec, Schema } from 'lisk-sdk';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { extname } from 'path';
import { Signed } from '../modules/signed-schemas';
import axios from 'axios';
import * as openpgp from 'openpgp';

let keyDir = "/trustseco/keys";

if (!existsSync("/trustseco")){
    // If trustseco doesn't exist just use the current directory
    // Otherwise tests don't pass as it is done outside of docker
    keyDir = "./keys";
}
if (!existsSync(keyDir)){
    mkdirSync(keyDir);
}

export class GPG {
    /** all GPG key URLs should be provided by github.com */
    static readonly urlPattern = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/;

    static validateURL = ( url: string ) => this.urlPattern.test(url);

    /** import a GPG key from a URL to a local file
    returns the account UID of the imported key */
    static async import( url: string ) : Promise<string> {
        const match = url.match(this.urlPattern);
        if (!match) throw new Error(`Url ${url} is not a GitHub GPG link`);
        const name = match[1];
        const { data } = await axios.get(url);
        const key = await openpgp.readKey({armoredKey: data});
        const accountUid = key.getKeyID().toHex().toUpperCase();
        writeFileSync(`${keyDir}/${name}.gpg`, data);
        if (accountUid === undefined) throw new Error(`Unable to find the uid for the GPG key from ${url}`);
        return accountUid;
    }

    /** verify the signature of a signed object
    * returns the account UID of the key used to sign the object 
    * Throws error on invalid signature */
    static async verify<T extends object>(asset : Signed<T>, schema : Schema) : Promise<string> {
        const encoded = codec.encode(schema, asset.data).toString('hex');
        const keys = await this.readKeys();
        const signature = await openpgp.readSignature({armoredSignature: asset.signature});
        const verificationResult = await openpgp.verify({
            message: await openpgp.createMessage({ text: encoded }),
            signature,
            verificationKeys: keys
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

    /** Read all the pgp files from the keyDir directory and parse them */
    private static async readKeys() : Promise<openpgp.Key[]> {
        const keys = [];
        const files = readdirSync(keyDir);
        for (const file of files) {
            if (extname(file) !== ".gpg") continue;
            try {
                const data = readFileSync(`${keyDir}/${file}`);
                keys.push(await openpgp.readKey({armoredKey: '' + data})) // akward implicit type conversion from buffer to string
            }
            catch {
                console.log(`Failed to import key ${file}`)
            }
        }
        return keys;
    }
}