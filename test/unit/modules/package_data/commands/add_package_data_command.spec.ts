import { AddPackageDataCommand } from '../../../../../src/app/modules/package_data/commands/add_package_data_command';
import {
	PackageDataListStore,
	PackageDataSchema,
	PackageData,
	packageListKey,
} from '../../../../../src/app/modules/package_data/stores/packagedata';
import { PackageDataModule } from '../../../../../src/app/modules/package_data/module';
import { testing, codec, cryptography, Transaction, chain, db } from 'lisk-sdk';

describe('AddPackageDataCommand', () => {
	let command: AddPackageDataCommand;
	let stateStore: any;
	let packagesStore: PackageDataListStore;

	const getSampleTransaction = (params: any, nonce: number) => ({
		module: 'packageData',
		command: AddPackageDataCommand.name,
		senderPublicKey: Buffer.from(
			'3bb9a44b71c83b95045486683fc198fe52dcf27b55291003590fcebff0a45d9a',
			'hex',
		),
		nonce: BigInt(nonce),
		fee: BigInt(100000000),
		params: codec.encode(PackageDataSchema, params),
		signatures: [cryptography.utils.getRandomBytes(64)],
	});

	const samplePackage: PackageData = {
		packageName: 'pack 1',
		packageOwner: 'henk',
		packagePlatform: 'pypi',
		packageReleases: ['v1.0.1'],
	};

	const samplePackage2: PackageData = {
		packageName: 'pack 2',
		packageOwner: 'kees',
		packagePlatform: 'pypi',
		packageReleases: ['v1.2.1'],
	};

	beforeEach(() => {
		const mod = new PackageDataModule();
		command = new AddPackageDataCommand(mod.stores, mod.events);
		stateStore = new chain.StateStore(new db.InMemoryDatabase());
		packagesStore = mod.stores.get(PackageDataListStore);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('addPackageData');
		});

		it('should have valid schema', () => {
			expect(command.schema).toMatchSnapshot();
		});
	});

	describe('verify', () => {
		describe('schema validation', () => {
			it.todo('should throw errors for invalid schema');
			it.todo('should be ok for valid schema');
		});
	});

	describe('execute', () => {
		describe('valid cases', () => {
			it('New package should be added', async () => {
				const transaction = new Transaction(getSampleTransaction(samplePackage, 0));
				const context = testing
					.createTransactionContext({
						stateStore,
						transaction,
						header: testing.createFakeBlockHeader({}),
					})
					.createCommandExecuteContext<PackageData>(PackageDataSchema);
				await command.execute(context);
				let packages = await packagesStore.get(context, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage] });
				const transaction2 = new Transaction(getSampleTransaction(samplePackage2, 1));
				const context2 = testing
					.createTransactionContext({
						stateStore,
						transaction: transaction2,
						header: testing.createFakeBlockHeader({}),
					})
					.createCommandExecuteContext<PackageData>(PackageDataSchema);
				await command.execute(context2);
				packages = await packagesStore.get(context2, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage, samplePackage2] });
			});
			it('Versions should be added together', async () => {
				const transaction = new Transaction(getSampleTransaction(samplePackage, 0));
				const context = testing
					.createTransactionContext({
						stateStore,
						transaction,
						header: testing.createFakeBlockHeader({}),
					})
					.createCommandExecuteContext<PackageData>(PackageDataSchema);
				await command.execute(context);
				let packages = await packagesStore.get(context, packageListKey);
				let package2 = structuredClone(samplePackage);
				package2.packageReleases = ["v2", "v3"]
				const transaction2 = new Transaction(getSampleTransaction(package2, 1));
				const context2 = testing
					.createTransactionContext({
						stateStore,
						transaction: transaction2,
						header: testing.createFakeBlockHeader({}),
					})
					.createCommandExecuteContext<PackageData>(PackageDataSchema);
				await command.execute(context2);
				packages = await packagesStore.get(context2, packageListKey);
				package2.packageReleases = ["v1.0.1", "v2", "v3"]
				expect(packages).toEqual({ packages: [package2] });
			});
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
