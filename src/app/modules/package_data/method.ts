import { Modules, StateMachine } from 'klayr-sdk';
import {
	PackageData,
	PackageDataListStore,
	packageListKey,
	PackageDataList
} from './stores/packagedata';

export class PackageDataMethod extends Modules.BaseMethod {
	public async getPackageInfo(ctx: StateMachine.ImmutableMethodContext, params: { packageName: string; packageOwner?: string; packagePlatform?: string}): Promise<PackageData> {
		const packagesStore = this.stores.get(PackageDataListStore);
		const packages = await packagesStore.get(ctx, packageListKey);
		const { packageName, packagePlatform, packageOwner } = params;
		if (typeof packageName !== 'string') {
			throw new Error('Parameter packageName must be a string.');
		}
		// Always filter on packageName
		// Filter on packageOwner and platform if the params were provided
		const pack = packages.packages.filter(
			p =>
				p.packageName === packageName &&
				(typeof packagePlatform !== 'string' || p.packagePlatform === packagePlatform) &&
				(typeof packageOwner !== 'string' || p.packageOwner === packageOwner),
		)[0];
		if (!pack) throw new Error('No package was found.');
		return pack;
	}

    public async getAllPackages(ctx: StateMachine.ImmutableMethodContext): Promise<PackageDataList> {
        const packagesStore = this.stores.get(PackageDataListStore);
        if (!await packagesStore.has(ctx, packageListKey)) return {packages: []}
        const packages = await packagesStore.get(ctx, packageListKey);
        return packages
    }
}
