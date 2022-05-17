import {BaseModule, codec} from 'lisk-sdk';
//import { PackageDataSchema } from './packagedata-schemas';
import {PackageDataAddDataAsset} from './assets/packagedata-add-data-asset';
import {PackageDataListSchema} from './packagedata-schemas';

export class PackageDataModule extends BaseModule {
    id = 6328;
    name = "packagedata";

    // INITIALIZE THE PACKAGE DATA LIST (EMPTY)
    /*
    async afterGenesisBlockApply({ stateStore }){
        let packageDataBuffer = codec.encode(PackageDataListSchema, {packageDataList:[]});
        await stateStore.chain.set("packagedata:packageDataList", packageDataBuffer);
    }
    */
    // TRANSACTIONS TO MODIFY THE PACKAGEDATA LIST 
    transactionAssets = [new PackageDataAddDataAsset];

    // ACTIONS TO GET THE CURRENT STATE OF THE PACKAGEDATA LIST
    actions = {
        // GET THE INFO ABOUT A SPECIFIC PACKAGE 
        getPackageInfo: async ({packageName} : Record<string, unknown>) => {
            console.log("Get the metadata for package: " + packageName);
            //get data bufer for the given package
            let packageDataBuffer:any = await this._dataAccess.getChainState("packageDataList:" + packageName);
            //if it is defined, decode packagedata buffer
            if(packageDataBuffer !== undefined){
                let {packageData} = codec.decode<{packageData:{packageName:string,packagePlatform:string,packageOwner:string,packageReleases:Array<string>}[]}>(PackageDataListSchema, packageDataBuffer);
                //if info is available, return it
                return packageData;
            }
            else throw new Error("No info is available for this package");
        },
        /*
        getAllPackages: async () => {
            let packagesBuffer:any = await this._dataAccess.getChainState("packagedata:packageDataList");
            return codec.decode(PackageDataListSchema, packagesBuffer);
        },
        */
    }

    //TODO add event when new package is added
    events = [];
}