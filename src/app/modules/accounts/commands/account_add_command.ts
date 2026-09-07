/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import * as GPG from '../../../common/gpg-verification';
import { AccountStore, Account } from '../stores/account';
import { KeysStore, keyIndex } from '../stores/keys';

interface Params {
	url: string;
	fingerprint?: string;
}

export class AccountAddCommand extends Modules.BaseCommand {
	public schema = {
		$id: 'account/accountAdd-params',
		title: 'accountAddCommand transaction parameter for the account module',
		type: 'object',
		required: ['url'],
		properties: {
			fingerprint: { dataType: 'string', fieldNumber: 2, minLength: 40, maxLength: 64 },
			url: {
				dataType: 'string',
				fieldNumber: 1,
				minLength: 23, // length of https://github.com/.gpg
				maxLength: 70, // min length + max username
			},
		},
	};

	public async verify(context: StateMachine.CommandVerifyContext<Params>): Promise<StateMachine.VerificationResult> {
		const {url, fingerprint} = context.params
        if (!GPG.validateURL(url)) throw new Error('url should be of the form https://github.com/[username].gpg');
        const { uid } = await GPG.import_(url, fingerprint);
		const accountStore = this.stores.get(AccountStore);
        // when the account is already known, we don't need to do anything
        if (await accountStore.has(context, Buffer.from(uid))) {
            throw new Error(`Account from ${url} already known as ${uid}`);
        }

		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(context: StateMachine.CommandExecuteContext<Params>): Promise<void> {
		const {url, fingerprint} = context.params
        context.logger.info(`Adding GPG key from ${url}`);

        const { uid, key } = await GPG.import_(url, fingerprint);

		const keysStore = this.stores.get(KeysStore);
        let gpgKeys: { key: string }[] = [];
        if (await keysStore.has(context, keyIndex)){
            gpgKeys = (await keysStore.get(context, keyIndex)).keys;
        }
        gpgKeys.push({key});
        await keysStore.set(context, keyIndex, { keys: gpgKeys });

        // create a new account with 50_000_000 reward tokens
		const accountStore = this.stores.get(AccountStore);
        const account: Account = { slingers: BigInt(50_000_000) };
        await accountStore.set(context, Buffer.from(uid), account);

        context.logger.info(`Added account ${uid} from ${url}`);
	}
}
