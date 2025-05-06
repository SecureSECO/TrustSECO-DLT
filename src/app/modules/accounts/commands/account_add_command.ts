/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { GPG } from '../../../common/gpg-verification';
import { AccountStore, Account } from '../stores/account';
import { KeysStore, keyIndex } from '../stores/keys';

interface Params {
	url: string;
}

export class AccountAddCommand extends BaseCommand {
	public schema = {
		$id: 'account/accountAdd-params',
		title: 'accountAddCommand transaction parameter for the account module',
		type: 'object',
		required: ['url'],
		properties: {
			url: {
				dataType: 'string',
				fieldNumber: 1,
				minLength: 23, // length of https://github.com/.gpg
				maxLength: 70, // min length + max username
			},
		},
	};

	public async verify(context: CommandVerifyContext<Params>): Promise<VerificationResult> {
		const url = context.params.url
        if (!GPG.validateURL(url)) throw new Error('url should be of the form https://github.com/[username].gpg');
		await GPG.import(url); // throws error on invalid import
        const { uid } = await GPG.import( url );
		const accountStore = this.stores.get(AccountStore);
        // when the account is already known, we don't need to do anything
        if (await accountStore.has(context, Buffer.from(uid))) {
            throw new Error(`Account from ${url} already known as ${uid}`);
        }

		return { status: VerifyStatus.OK };
	}

	public async execute(context: CommandExecuteContext<Params>): Promise<void> {
		const url = context.params.url
        context.logger.info(`Adding GPG key from ${url}`);

        const { uid, key } = await GPG.import( url );

		const keysStore = this.stores.get(KeysStore);
        let gpg_keys: { key: string }[] = [];
        if (await keysStore.has(context, keyIndex)){
            gpg_keys = (await keysStore.get(context, keyIndex)).keys;
        }
        gpg_keys.push({key});
        await keysStore.set(context, keyIndex, { keys: gpg_keys });

        // create a new account with 50_000_000 reward tokens
		const accountStore = this.stores.get(AccountStore);
        const account : Account = { slingers: BigInt(50_000_000) };
        await accountStore.set(context, Buffer.from(uid), account);

        context.logger.info(`Added account ${uid} from ${url}`);
	}
}
