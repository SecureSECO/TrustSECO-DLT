import { BaseModule, codec } from 'lisk-sdk';
//import { PackageDataSchema } from './packagedata-schemas';
import { PackageDataAddDataAsset } from './assets/packagedata-add-data-asset';
import { PackageDataSchema, PackageData, PackageDataListSchema, PackageDataList } from './packagedata-schemas';

export class PackageDataModule extends BaseModule {
    id = 6328;
    name = "packagedata";

    // TRANSACTIONS TO MODIFY THE PACKAGEDATA LIST 
    transactionAssets = [new PackageDataAddDataAsset];

    // ACTIONS TO GET THE CURRENT STATE OF THE PACKAGEDATA LIST
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
            return codec.decode<PackageDataList>(PackageDataListSchema, packageDataBuffer);
        } 
    }

    async afterGenesisBlockApply({ stateStore }) {
        const allPackagesBuffer = codec.encode(PackageDataListSchema, { packages: [] });
        await stateStore.chain.set("packagedata:allPackages", allPackagesBuffer);
    }

    //TODO add event when new package is added
    events = [];
}