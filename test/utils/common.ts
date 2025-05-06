import {
	Transaction,
	testing,
	Schema,
	codec,
	cryptography,
	BaseCommand,
	CommandExecuteContext,
} from 'klayr-sdk';
import { AddPackageDataCommand } from '../../src/app/modules/package_data/commands/add_package_data_command';
import { PackageDataListStore } from '../../src/app/modules/package_data/stores/packagedata';
import { PackageDataModule } from '../../src/app/modules/package_data/module';
import { chain, db } from 'klayr-sdk';
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
	params: any,
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

export async function executeTransaction<CommandType extends BaseCommand>(
	command: CommandType,
	stateStore: any,
	transaction: Transaction,
	paramsSchema: Schema,
): Promise<CommandExecuteContext<CommandType>> {
	const context = testing
		.createTransactionContext({
			stateStore,
			transaction,
			header: testing.createFakeBlockHeader({}),
		})
		.createCommandExecuteContext<CommandType>(paramsSchema);
	await command.execute(context);
	return context;
}

export async function createAndExecuteTransaction<CommandType extends BaseCommand>(
	params: any,
	paramsSchema: Schema,
	nonce: number,
	command: CommandType,
	stateStore: any,
): Promise<CommandExecuteContext<CommandType>> {
	const trans = createTransaction(params, paramsSchema, nonce, command.name);
	return await executeTransaction(command, stateStore, trans, paramsSchema);
}

export interface ModulesCollection {
  modules: {
    accountsModule: AccountsModule,
    packageModule: PackageDataModule,
    trustfactsModule: TrustfactsModule,
    codaModule: CodaModule
  },
  commands: {
    accountsCommand: BaseCommand,
    packageCommand: AddPackageDataCommand,
    trustfactsCommand: BaseCommand,
    codaCommand: BaseCommand
  },
  stores: {
    packagesStore: PackageDataListStore,
    accountsStore: AccountStore,
    keysStore: KeysStore,
    accountIdStore: AccountIdStore,
    accountUrlStore: AccountUrlStore,
    codaJobsStore: CodaJobListStore,
    codaJobIdStore: CodaJobIdStore,
    trustFactsStore: TrustFactsStore
  },
  stateStore: chain.StateStore
}

export function createModules(): ModulesCollection {
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
	trustfactsModule.addDependecies(codaModule.method, accountsModule.method);

	const stateStore = new chain.StateStore(new db.InMemoryDatabase());

	// Get all stores
	const packagesStore = packageModule.stores.get(PackageDataListStore);
	const accountsStore = accountsModule.stores.get(AccountStore);
	const keysStore = accountsModule.stores.get(KeysStore);
	const accountIdStore = accountsModule.stores.get(AccountIdStore);
	const accountUrlStore = accountsModule.stores.get(AccountUrlStore);
	const codaJobsStore = codaModule.stores.get(CodaJobListStore);
	const codaJobIdStore = codaModule.stores.get(CodaJobIdStore);
	const trustFactsStore = trustfactsModule.stores.get(TrustFactsStore);

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
