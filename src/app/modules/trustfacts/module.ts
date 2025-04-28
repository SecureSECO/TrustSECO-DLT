/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
    BaseModule,
    ModuleMetadata
} from 'lisk-sdk';
import { AddFactCommand } from "./commands/add_fact_command";
import { TrustfactsEndpoint } from './endpoint';
import { TrustfactsMethod } from './method';
import { CodaMethod } from '../coda/method';

export class TrustfactsModule extends BaseModule {
    public endpoint = new TrustfactsEndpoint(this.stores, this.offchainStores);
    public method = new TrustfactsMethod(this.stores, this.events);
    public commands = [new AddFactCommand(this.stores, this.events)];

	// public constructor() {
	// 	super();
	// 	// registeration of stores and events
	// }

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [],
			assets: [],
		};
	}

    public addDependecies(codaMethod: CodaMethod) {
		this.commands[0].addDependecies(codaMethod);
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
