/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';

import { PackageDataSchema, PackageData, PackageDataList, PackageDataListStore, packageListKey } from '../stores/packagedata';

export class AddPackageDataCommand extends BaseCommand {
	public schema = PackageDataSchema;

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(context: CommandVerifyContext<PackageData>): Promise<VerificationResult> {
		const asset = context.params;
		// Prevents users from adding duplicate packages, differentiated by whitespaces
		if (asset.packageName !== asset.packageName.trim()) throw new Error('package name cannot start or end with whitespace');
		if (asset.packageName !== asset.packageName.toLowerCase()) throw new Error('package name must be lowercase');
		if (asset.packagePlatform !== asset.packagePlatform.trim()) throw new Error('package platform cannot start or end with whitespace');
		if (asset.packagePlatform !== asset.packagePlatform.toLowerCase()) throw new Error('package platform must be lowercase');
		if (asset.packageOwner !== asset.packageOwner.trim()) throw new Error('package owner cannot start or end with whitespace');
		if (asset.packageOwner !== asset.packageOwner.toLowerCase()) throw new Error('package owner must be lowercase');
		for (const version of asset.packageReleases) {
			if (!/^[^~^:"?[*@{]+$/.test(version)) throw new Error('Package release must be a valid git tag');
		}
		if (asset.packageName === '') throw new Error('package name is required and cannot be empty');
		if (asset.packagePlatform === '') throw new Error('package platform is required and cannot be empty');
		if (asset.packageOwner === '') throw new Error('package owner is required and cannot be empty');
		if (asset.packageReleases.length === 0) throw new Error('at least one release is required, the list can not be empty');
		return { status: VerifyStatus.OK };
	}

	public async execute(context: CommandExecuteContext<PackageData>): Promise<void> {
		const asset = context.params;
		const packagesStore = this.stores.get(PackageDataListStore);
		let packages: PackageDataList;
		try {
			// throws error if packages list doesn't exist yet
			packages = await packagesStore.get(context, packageListKey);
		}
		catch {
			packages = { packages: [] };
		}
		// Find package with same owner, name and platform if it exists
		const index = packages.packages.findIndex((pack) => pack.packageOwner === asset.packageOwner
			&& pack.packagePlatform === asset.packagePlatform
			&& pack.packageName === asset.packageName);
		if (index === -1) {
			packages.packages.push(asset);
		}
		// If the package already exists just add the new versions (if any are new)
		else {
			for (const version of asset.packageReleases){
				if (!packages.packages[index].packageReleases.some((vers)=> vers === version)){
					packages.packages[index].packageReleases.push(version);
				}
			}
		}
		await packagesStore.set(context, packageListKey, packages);
	}
}
