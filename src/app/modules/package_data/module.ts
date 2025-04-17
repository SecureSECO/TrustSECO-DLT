/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
    BaseModule,
    ModuleMetadata
} from 'lisk-sdk';
import { AddPackageDataCommand } from "./commands/add_package_data_command";
import { PackageDataEndpoint } from './endpoint';
import { PackageDataMethod } from './method';
import {
    PackageDataListSchema, PackageDataListStore, PackageDataSchema
} from './stores/packagedata';

export class PackageDataModule extends BaseModule {
	public endpoint = new PackageDataEndpoint(this.stores, this.offchainStores);
	public method = new PackageDataMethod(this.stores, this.events);
	public commands = [new AddPackageDataCommand(this.stores, this.events)];

	public constructor() {
		super();
		this.stores.register(PackageDataListStore, new PackageDataListStore(this.name, 0));
	}

	public metadata(): ModuleMetadata {
		return {
			endpoints: [
				{
					name: this.endpoint.getAllPackages.name,
					response: PackageDataListSchema,
				},
				{
					name: this.endpoint.getPackageInfo.name,
					response: PackageDataSchema,
					request: {
						$id: 'packagedata/packageRequest',
						type: 'object',
						required: [ 'packageName' ],
						properties: {
							packageName: {
								dataType: 'string',
								fieldNumber: 1,
							},
							packagePlatform: {
								dataType: 'string',
								fieldNumber: 2,
							},
							packageOwner: {
								dataType: 'string',
								fieldNumber: 3,
							},
						},
					},
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
