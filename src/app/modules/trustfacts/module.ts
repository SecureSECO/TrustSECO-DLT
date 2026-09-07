/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { Modules, StateMachine } from 'klayr-sdk';
import { AddFactCommand } from './commands/add_fact_command';
import { TrustfactsEndpoint } from './endpoint';
import { TrustfactsMethod } from './method';
import { CodaMethod } from '../coda/method';
import { TrustFactsStore, RequestSchema, AddTrustFactSchema, trustFactsIndex } from './stores/trustfacts';
import { AccountsMethod } from '../accounts/method';
import { PackageDataMethod } from '../package_data/method';

export class TrustfactsModule extends Modules.BaseModule {
	public endpoint = new TrustfactsEndpoint(this.stores, this.offchainStores);
	public method = new TrustfactsMethod(this.stores, this.events);
	public commands = [new AddFactCommand(this.stores, this.events)];

	public constructor() {
		super();
		this.stores.register(TrustFactsStore, new TrustFactsStore(this.name, 0));
	}

	public metadata(): Modules.ModuleMetadata {
		return {
			endpoints: [
                { name: this.endpoint.calculateScoreForFacts.name },
				{
					name: this.endpoint.calculateTrustScore.name,
					request: RequestSchema,
				},
				{
					name: this.endpoint.calculateCategoryTrustScores.name,
					request: RequestSchema,
				},
				{
					name: this.endpoint.encodeTrustFact.name,
					request: AddTrustFactSchema
				},
				{
					name: this.endpoint.getPackageFacts.name,
					request: RequestSchema,
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

	public addDependecies(codaMethod: CodaMethod, accountsMethod: AccountsMethod, packageDataMethod: PackageDataMethod) {
		this.commands[0].addDependecies(codaMethod, accountsMethod);
		this.endpoint.addDependecies(this.method, packageDataMethod);
	}

	public async initGenesisState(context: StateMachine.GenesisBlockExecuteContext): Promise<void> {
		const factsStore = this.stores.get(TrustFactsStore);
		await factsStore.set(context, trustFactsIndex, { facts: [] })
	}
}
