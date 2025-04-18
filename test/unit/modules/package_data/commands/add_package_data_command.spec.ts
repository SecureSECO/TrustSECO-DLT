import { AddPackageDataCommand } from '../../../../../src/app/modules/package_data/commands/add_package_data_command';
import {
	PackageDataListStore,
	PackageDataSchema,
	PackageData,
	packageListKey,
} from '../../../../../src/app/modules/package_data/stores/packagedata';
import { PackageDataModule } from '../../../../../src/app/modules/package_data/module';
import { chain, db } from 'lisk-sdk';
import { createAndExecuteTransaction } from '../../../../utils/common';

describe('AddPackageDataCommand', () => {
	let command: AddPackageDataCommand;
	let stateStore: any;
	let packagesStore: PackageDataListStore;

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
				let context = await createAndExecuteTransaction(samplePackage, PackageDataSchema, 0, command, stateStore);
				let packages = await packagesStore.get(context, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage] });
				let context2 = await createAndExecuteTransaction(samplePackage2, PackageDataSchema, 1, command, stateStore);
				packages = await packagesStore.get(context2, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage, samplePackage2] });
			});
			it('Versions should be added together', async () => {
				let context = await createAndExecuteTransaction(samplePackage, PackageDataSchema, 0, command, stateStore);
				let packages = await packagesStore.get(context, packageListKey);
				let package2 = structuredClone(samplePackage);
				package2.packageReleases = ["v2", "v3"]
				let context2 = await createAndExecuteTransaction(package2, PackageDataSchema, 0, command, stateStore);
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
