import { BaseModule, codec } from 'lisk-sdk';
import { PackageDataAddDataAsset } from './assets/packagedata-add-data-asset';
import { PackageDataSchema, PackageData, PackageDataListSchema, PackageDataList } from './packagedata-schemas';

export class PackageDataModule extends BaseModule {
    id = 6328;
    name = "packagedata";
    transactionAssets = [
        new PackageDataAddDataAsset()
    ];

    actions = {
        getPackageInfo: async ({ packageName }: Record<string, unknown>) => {
            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:" + packageName);
            if (packageDataBuffer !== undefined) {
                return codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
            }
            else throw new Error("No info is available for this package");
        },
        getAllPackages: async () => {
            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:allPackages") as Buffer;
            if (packageDataBuffer !== undefined) {
                return codec.decode<PackageDataList>(PackageDataListSchema, packageDataBuffer);
            }
            else throw new Error("There are no packages added yet");
        } 
    }

    async afterGenesisBlockApply({ stateStore }) {
        const allPackagesBuffer = codec.encode(PackageDataListSchema, { packages: [] });
        await stateStore.chain.set("packagedata:allPackages", allPackagesBuffer);
    }
}