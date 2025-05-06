import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { PackageData, PackageDataList, PackageDataListStore, packageListKey } from './stores/packagedata';

export class PackageDataEndpoint extends BaseEndpoint {
    public async getAllPackages(ctx: ModuleEndpointContext): Promise<PackageDataList> {
        const packagesStore = this.stores.get(PackageDataListStore);
        if (!await packagesStore.has(ctx, packageListKey)) return {packages: []}
        const packages = await packagesStore.get(ctx, packageListKey);
        return packages
    }
    public async getPackageInfo(ctx: ModuleEndpointContext): Promise<PackageData> {
        const packagesStore = this.stores.get(PackageDataListStore);
        const packages = await packagesStore.get(ctx, packageListKey);
        const { packageName, packagePlatform, packageOwner } = ctx.params;
        if (typeof packageName !== 'string') {
            throw new Error('Parameter packageName must be a string.');
        }
        // Always filter on packageName
        // Filter on packageOwner and platform if the params were provided
        const pack = packages.packages.filter((pack) => 
            pack.packageName === packageName 
            && (typeof packagePlatform !== 'string' || pack.packagePlatform === packagePlatform)
            && (typeof packageOwner !== 'string' || pack.packageOwner === packageOwner)
        )[0];
        if (!pack) throw new Error('No package was found.');
        return pack;
    }
}
