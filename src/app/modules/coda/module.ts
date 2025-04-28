/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, ModuleMetadata, GenesisBlockExecuteContext } from 'lisk-sdk';
import { AddJobCommand } from './commands/add_job_command';
import { CodaEndpoint } from './endpoint';
import { CodaMethod } from './method';
import { CodaJobListStore, minimalCodaJobSchema, CodaJobIdStore, jobIdKey, jobListKey } from './stores/coda-schemas';
import { AccountsMethod } from '../accounts/method';
import { PackageDataMethod } from '../package_data/method';
import { TrustfactsMethod } from '../trustfacts/method';

export class CodaModule extends BaseModule {
	public endpoint = new CodaEndpoint(this.stores, this.offchainStores);
	public method = new CodaMethod(this.stores, this.events);
	public commands = [new AddJobCommand(this.stores, this.events)];

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(CodaJobListStore, new CodaJobListStore(this.name, 0));
		this.stores.register(CodaJobIdStore, new CodaJobIdStore(this.name, 1));
	}

	public metadata(): ModuleMetadata {
		return {
			endpoints: [
				{
					name: this.endpoint.encodeCodaJob.name,
					request: minimalCodaJobSchema,
				},
				{
					name: this.endpoint.getAllFacts.name,
				},
				{
					name: this.endpoint.getJobs.name,
				},
				{
					name: this.endpoint.getMinimumRequiredBounty.name,
				}
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

    public addDependecies(accountsMethod: AccountsMethod, packageDataMethod: PackageDataMethod, trustfactsMethod: TrustfactsMethod) {
		this.method.addDependecies(trustfactsMethod);
		this.endpoint.addDependecies(this.method);
		this.commands[0].addDependecies(accountsMethod, this.method, packageDataMethod, trustfactsMethod);
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
	//
	public async initGenesisState(context: GenesisBlockExecuteContext): Promise<void> {
		const jobIdStore = this.stores.get(CodaJobIdStore);
		jobIdStore.set(context, jobIdKey, { jobId: 0 })

		const jobsStore = this.stores.get(CodaJobListStore);
		jobsStore.set(context, jobListKey, {jobs: []})
	}

	// TODO: beforeBlockApply removing of jobs
	
	// public async finalizeGenesisState(_context: GenesisBlockExecuteContext): Promise<void> {

	// }

	// public async beforeTransactionsExecute(_context: BlockExecuteContext): Promise<void> {

	// }

	// public async afterTransactionsExecute(_context: BlockAfterExecuteContext): Promise<void> {

	// }
}
