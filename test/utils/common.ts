import {
	Transaction,
	testing,
	Schema,
	codec,
	cryptography,
	Modules,
	StateMachine
} from 'klayr-sdk';
import { createGenesisBlockContext } from "klayr-framework/dist-node/testing/create_contexts"
import { PrefixedStateReadWriter } from 'klayr-framework/dist-node/state_machine/prefixed_state_read_writer';
import { InMemoryPrefixedStateDB } from 'klayr-framework/dist-node/testing';
import { AddPackageDataCommand } from '../../src/app/modules/package_data/commands/add_package_data_command';
import { PackageDataListStore, packageListKey } from '../../src/app/modules/package_data/stores/packagedata';
import { PackageDataModule } from '../../src/app/modules/package_data/module';
import { AccountsModule } from '../../src/app/modules/accounts/module';
import { CodaModule } from '../../src/app/modules/coda/module';
import { TrustfactsModule } from '../../src/app/modules/trustfacts/module';
import { AccountStore } from '../../src/app/modules/accounts/stores/account';
import { KeysStore } from '../../src/app/modules/accounts/stores/keys';
import { AccountIdStore } from '../../src/app/modules/accounts/stores/account-id';
import { AccountUrlStore } from '../../src/app/modules/accounts/stores/account-url';
import { CodaJobListStore, CodaJobIdStore } from '../../src/app/modules/coda/stores/coda-schemas';
import { TrustFactsStore } from '../../src/app/modules/trustfacts/stores/trustfacts';

export function createTransaction(
	params: object,
	paramsSchema: Schema,
	nonce: number,
	commandName: string,
): Transaction {
	return new Transaction({
		module: 'packageData',
		command: commandName,
		senderPublicKey: Buffer.from(
			'3bb9a44b71c83b95045486683fc198fe52dcf27b55291003590fcebff0a45d9a',
			'hex',
		),
		nonce: BigInt(nonce),
		fee: BigInt(100000000),
		params: codec.encode(paramsSchema, params),
		signatures: [cryptography.utils.getRandomBytes(64)],
	});
}

export async function executeTransaction<CommandType extends Modules.BaseCommand>(
	command: CommandType,
	stateStore: any,
	transaction: Transaction,
	paramsSchema: Schema,
): Promise<StateMachine.CommandExecuteContext<CommandType>> {
	const context = testing
		.createTransactionContext({
			stateStore,
			transaction,
			header: testing.createFakeBlockHeader({}),
		})
		.createCommandExecuteContext<CommandType>(paramsSchema);
	await command.execute(context as unknown as StateMachine.CommandExecuteContext<unknown>);
	return context;
}

export async function createAndExecuteTransaction<CommandType extends Modules.BaseCommand>(
	params: object,
	paramsSchema: Schema,
	nonce: number,
	command: CommandType,
	stateStore: any,
): Promise<StateMachine.CommandExecuteContext<CommandType>> {
	const trans = createTransaction(params, paramsSchema, nonce, command.name);
	return executeTransaction(command, stateStore, trans, paramsSchema);
}

export interface ModulesCollection {
  modules: {
    accountsModule: AccountsModule;
    packageModule: PackageDataModule;
    trustfactsModule: TrustfactsModule;
    codaModule: CodaModule;
  };
  commands: {
    accountsCommand: Modules.BaseCommand;
    packageCommand: AddPackageDataCommand;
    trustfactsCommand: Modules.BaseCommand;
    codaCommand: Modules.BaseCommand;
  };
  stores: {
    packagesStore: PackageDataListStore;
    accountsStore: AccountStore;
    keysStore: KeysStore;
    accountIdStore: AccountIdStore;
    accountUrlStore: AccountUrlStore;
    codaJobsStore: CodaJobListStore;
    codaJobIdStore: CodaJobIdStore;
    trustFactsStore: TrustFactsStore;
  };
  stateStore: PrefixedStateReadWriter;
}

export async function createModules(): Promise<ModulesCollection> {
	const accountsModule = new AccountsModule();
	const accountsCommand = accountsModule.commands[0];

	const packageModule = new PackageDataModule();
	const packageCommand = packageModule.commands[0];

	const trustfactsModule = new TrustfactsModule();
	const trustfactsCommand = trustfactsModule.commands[0];

	const codaModule = new CodaModule();
	const codaCommand = codaModule.commands[0];

	// Add dependencies
	codaModule.addDependecies(accountsModule.method, packageModule.method, trustfactsModule.method);
	trustfactsModule.addDependecies(codaModule.method, accountsModule.method, packageModule.method);

	const stateStore = new PrefixedStateReadWriter(new InMemoryPrefixedStateDB());

	// Get all stores
	const packagesStore = packageModule.stores.get(PackageDataListStore);
	const accountsStore = accountsModule.stores.get(AccountStore);
	const keysStore = accountsModule.stores.get(KeysStore);
	const accountIdStore = accountsModule.stores.get(AccountIdStore);
	const accountUrlStore = accountsModule.stores.get(AccountUrlStore);
	const codaJobsStore = codaModule.stores.get(CodaJobListStore);
	const codaJobIdStore = codaModule.stores.get(CodaJobIdStore);
	const trustFactsStore = trustfactsModule.stores.get(TrustFactsStore);

	const context = createGenesisBlockContext({
				chainID: Buffer.from([0, 0, 0, 0]),
				stateStore
			}).createInitGenesisStateContext();
	await accountsModule.initGenesisState(context);
	await packageModule.initGenesisState(context);
	await packagesStore.set(context, packageListKey, { packages: [] });
	await trustfactsModule.initGenesisState(context);
	await codaModule.initGenesisState(context);
	return {
		modules: {
			accountsModule,
			packageModule,
			trustfactsModule,
			codaModule,
		},
		commands: {
			accountsCommand,
			packageCommand,
			trustfactsCommand,
			codaCommand,
		},
		stores: {
			packagesStore,
			accountsStore,
			keysStore,
			accountIdStore,
			accountUrlStore,
			codaJobsStore,
			codaJobIdStore,
			trustFactsStore,
		},
		stateStore,
	};
}
