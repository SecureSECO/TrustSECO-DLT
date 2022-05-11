import {BaseModule, codec} from 'lisk-sdk';
//import { PackageDataSchema } from './packagedata-schemas';
import {PackageDataAddDataAsset} from './assets/packagedata-add-data-asset';
import {PackageDataListSchema} from './packagedata-schemas';

export class PackageDataModule extends BaseModule {
    id = 1235;
    name = "packagedata";

    // INITIALIZE THE PACKAGE DATA LIST (EMPTY)
    async afterBlockApply({ stateStore }){
        let packageDataBuffer = codec.encode(PackageDataListSchema, {packageDataList:[]});
        await stateStore.chain.set("packagedata:packageDataList", packageDataBuffer);
    }

    transactionAssets = [new PackageDataAddDataAsset];

    actions = {
        //TODO getPackageInfo(packagename / ID)
    }

    events = [];
}