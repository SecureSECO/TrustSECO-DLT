import {BaseAsset, codec} from "lisk-sdk";
import {PackageDataSchema, PackageDataListSchema} from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset{
    static id = 63280; // meta-0
    id = PackageDataAddDataAsset.id;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({asset}){
        if(asset.packageName === "") throw new Error("package name is required and cannot be empty");
        if(asset.packagePlatform === "") throw new Error("package platform is required and cannot be empty");
        if(asset.packageOwner === "") throw new Error("package owner is required and cannot be empty");
        if(asset.packageReleases === []) throw new Error("at least one release is required, the list can not be empty");
    };

    async apply({asset, stateStore}) {
        let packageDataListBuffer = await stateStore.chain.get("packagedata:" + asset.packageName);
        let {packageDataList} = codec.decode<{packageDataList:[{package:string}]}>(PackageDataListSchema, packageDataListBuffer);
        
        let packageData : {}[] = [];
        
        if(packageDataList !== undefined){
            packageData = codec.decode<{packageData:[]}>(PackageDataListSchema, packageDataListBuffer).packageData;
        }

        packageData.push(asset);

        await stateStore.chain.set("packagedata:" + asset.packageName, codec.encode(PackageDataListSchema, {packageData}));
    }
}