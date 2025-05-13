import { codec, Schema } from 'klayr-sdk';
import axios, { AxiosResponse } from 'axios';
import * as openpgp from 'openpgp';
import { Signed } from './signed-schemas';

export interface ImportResult {
	uid: string;
	key: string;
}

/** all GPG key URLs should be provided by github.com */
const urlPattern = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})\.gpg$/;

export const validateURL = (url: string) => urlPattern.test(url);

/** import a GPG key from a URL
 * returns the account UID, and a string containing the armored key */
export async function import_(url: string): Promise<ImportResult> {
	const match = url.match(urlPattern);
	if (!match) throw new Error(`Url ${url} is not a GitHub GPG link`);
	const response: AxiosResponse<string> = await axios.get(url);
	const { data } = response;
	const key = await openpgp.readKey({ armoredKey: data });
	const accountUid = key.getKeyID().toHex().toUpperCase();
	if (accountUid === undefined)
		throw new Error(`Unable to find the uid for the GPG key from ${url}`);
	return { uid: accountUid, key: data };
}

/** verify the signature of a signed object
 * returns the account UID of the key used to sign the object
 * Throws error on invalid signature */
export async function verify<T extends object>(
	asset: Signed<T>,
	schema: Schema,
	keys: string[],
): Promise<string> {
	const encoded = codec.encode(schema, asset.data).toString('hex');
	const parsedKeys = await readKeys(keys);
	const signature = await openpgp.readSignature({ armoredSignature: asset.signature });
	const verificationResult = await openpgp.verify({
		message: await openpgp.createMessage({ text: encoded }),
		signature,
		verificationKeys: parsedKeys,
	});
	const { verified, keyID } = verificationResult.signatures[0];

	try {
		await verified;
	} catch {
		throw new Error('GPG signature verification failed');
	}
	const accountUid = keyID.toHex().toUpperCase();
	if (accountUid === undefined) {
		throw new Error('Unable to find the uid for the provided GPG key');
	}
	return accountUid;
}

/** Read all the pgp files from the argument and parse them */
export async function readKeys(keys: string[]): Promise<openpgp.Key[]> {
	const parsedKeys: openpgp.Key[] = [];
	for (const key of keys) {
		try {
			parsedKeys.push(await openpgp.readKey({ armoredKey: key }));
		} catch {
			// eslint-disable-next-line no-console
			console.log(`Failed to import key ${key}`);
		}
	}
	return parsedKeys;
}
