import {
	PackageDataSchema,
	PackageData,
	packageListKey,
} from '../../../../../src/app/modules/package_data/stores/packagedata';
import { createAndExecuteTransaction, createModules, ModulesCollection } from '../../../../utils/common';

describe('AddPackageDataCommand', () => {
	let modules: ModulesCollection

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

	beforeEach(async () => {
		modules = await createModules();
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(modules.commands.packageCommand.name).toBe('addPackageData');
		});

		it('should have valid schema', () => {
			expect(modules.commands.packageCommand.schema).toMatchSnapshot();
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
				const context = await createAndExecuteTransaction(samplePackage, PackageDataSchema, 0, modules.commands.packageCommand, modules.stateStore);
				let packages = await modules.stores.packagesStore.get(context, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage] });
				const context2 = await createAndExecuteTransaction(samplePackage2, PackageDataSchema, 1, modules.commands.packageCommand, modules.stateStore);
				packages = await modules.stores.packagesStore.get(context2, packageListKey);
				expect(packages).toEqual({ packages: [samplePackage, samplePackage2] });
			});
			it('Versions should be added together', async () => {
				const context = await createAndExecuteTransaction(samplePackage, PackageDataSchema, 0, modules.commands.packageCommand, modules.stateStore);
				let packages = await modules.stores.packagesStore.get(context, packageListKey);
				const package2 = structuredClone(samplePackage);
				package2.packageReleases = ["v2", "v3"]
				const context2 = await createAndExecuteTransaction(package2, PackageDataSchema, 1, modules.commands.packageCommand, modules.stateStore);
				packages = await modules.stores.packagesStore.get(context2, packageListKey);
				package2.packageReleases = ["v1.0.1", "v2", "v3"]
				expect(packages).toEqual({ packages: [package2] });
			});
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
