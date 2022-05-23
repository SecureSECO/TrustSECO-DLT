import {BaseModule, codec} from 'lisk-sdk';
//import { PackageDataSchema } from './packagedata-schemas';
import {PackageDataAddDataAsset} from './assets/packagedata-add-data-asset';
import {PackageDataSchema} from './packagedata-schemas';

export class PackageDataModule extends BaseModule {
    id = 6328;
    name = "packagedata";

    // TRANSACTIONS TO MODIFY THE PACKAGEDATA LIST 
    transactionAssets = [new PackageDataAddDataAsset];

    // ACTIONS TO GET THE CURRENT STATE OF THE PACKAGEDATA LIST
    actions = {
        // GET THE INFO ABOUT A SPECIFIC PACKAGE 
        getPackageInfo: async ({packageName} : Record<string, unknown>) => {
            console.log("Get the metadata for package: " + packageName);
            //get data bufer for the given package
            const packageDataBuffer:any = await this._dataAccess.getChainState("packagedata:" + packageName);
            //if it is defined, decode packagedata buffer
            if(packageDataBuffer !== undefined){
                const packageData = codec.decode<{packageData:[{package:string}]}>(PackageDataSchema, packageDataBuffer);
                //if info is available, return it
                return packageData;
            }
            else throw new Error("No info is available for this package");
        },
    }

    //TODO add event when new package is added
    events = [];
}