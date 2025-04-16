/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
    BaseModule,
	ModuleMetadata,
	// ModuleInitArgs,
	// InsertAssetContext,
	// BlockVerifyContext,
	// TransactionVerifyContext,
	// VerificationResult,
	// TransactionExecuteContext,
	// GenesisBlockExecuteContext,
	// BlockExecuteContext,
	// BlockAfterExecuteContext,
	// VerifyStatus,
} from 'lisk-sdk';
import { AccountsEndpoint } from './endpoint';
import { AccountsMethod } from './method';
import { KeysStore } from './stores/keys';
import { AccountStore } from './stores/account';
import { AccountIdStore } from './stores/account-id';
import { AccountUrlStore } from './stores/account-url';

export class AccountsModule extends BaseModule {
    public endpoint = new AccountsEndpoint(this.stores, this.offchainStores);
    public method = new AccountsMethod(this.stores, this.events);
    public commands = [];

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
			...this.baseMetadata(),
			endpoints: [],
			assets: [],
		};
	}

    // Lifecycle hooks
    // public async init(_args: ModuleInitArgs): Promise<void> {
	// 	// initialize this module when starting a node
	// }

	// public async insertAssets(_context: InsertAssetContext) {
	// 	// initialize block generation, add asset
	// }

	// public async verifyAssets(_context: BlockVerifyContext): Promise<void> {
	// 	// verify block
	// }

    // Lifecycle hooks
	// public async verifyTransaction(_context: TransactionVerifyContext): Promise<VerificationResult> {
		// verify transaction will be called multiple times in the transaction pool
		// return { status: VerifyStatus.OK };
	// }

	// public async beforeCommandExecute(_context: TransactionExecuteContext): Promise<void> {
	// }

	// public async afterCommandExecute(_context: TransactionExecuteContext): Promise<void> {

	// }
	// public async initGenesisState(_context: GenesisBlockExecuteContext): Promise<void> {

	// }

	// public async finalizeGenesisState(_context: GenesisBlockExecuteContext): Promise<void> {

	// }

	// public async beforeTransactionsExecute(_context: BlockExecuteContext): Promise<void> {

	// }

	// public async afterTransactionsExecute(_context: BlockAfterExecuteContext): Promise<void> {

	// }
}
