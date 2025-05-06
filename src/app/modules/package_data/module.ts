/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
    BaseModule,
    ModuleMetadata,
	GenesisBlockExecuteContext
} from 'klayr-sdk';
import { AddPackageDataCommand } from "./commands/add_package_data_command";
import { PackageDataEndpoint } from './endpoint';
import { PackageDataMethod } from './method';
import {
    PackageDataListSchema, PackageDataListStore, PackageDataSchema, packageListKey 
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

	public async initGenesisState(context: GenesisBlockExecuteContext): Promise<void> {
		const packagesStore = this.stores.get(PackageDataListStore);
		packagesStore.set(context, packageListKey, { packages: [] })
	}
}
