/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, GenesisBlockExecuteContext, ModuleMetadata } from 'lisk-sdk';
import { AccountAddCommand } from './commands/account_add_command';
import { AccountsEndpoint } from './endpoint';
import { AccountsMethod } from './method';
import { AccountStore, AccountSchemaSerial } from './stores/account';
import { AccountIdStore, AccountIdSchema } from './stores/account-id';
import { AccountUrlStore } from './stores/account-url';
import { KeysStore, KeysSchema, keyIndex } from './stores/keys';

export class AccountsModule extends BaseModule {
	public endpoint = new AccountsEndpoint(this.stores, this.offchainStores);
	public method = new AccountsMethod(this.stores, this.events);
	public commands = [new AccountAddCommand(this.stores, this.events)];

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(KeysStore, new KeysStore(this.name, 0));
		this.stores.register(AccountStore, new AccountStore(this.name, 1));
		this.stores.register(AccountIdStore, new AccountIdStore(this.name, 2));
		this.stores.register(AccountUrlStore, new AccountUrlStore(this.name, 3));
	}

	public metadata(): ModuleMetadata {
		return {
			endpoints: [
				{
					name: this.endpoint.getKeys.name,
					response: KeysSchema,
				},
				{
					name: this.endpoint.getAccount.name,
					response: AccountSchemaSerial,
					request: AccountIdSchema,
				},
			],
			commands: this.commands.map(command => ({
				name: command.name,
				params: command.schema,
			})),
			events: this.events.values().map(v => ({
				name: v.name,
				data: v.schema,
			})),
			assets: [],
			stores: [],
		};
	}

	public async initGenesisState(context: GenesisBlockExecuteContext): Promise<void> {
		const keyStore = this.stores.get(KeysStore);
		keyStore.set(context, keyIndex, { keys: [] })
	}
}
