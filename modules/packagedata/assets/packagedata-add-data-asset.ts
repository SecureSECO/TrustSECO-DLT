import { BaseAsset, codec } from "lisk-sdk";
import { PackageDataSchema, PackageDataListSchema } from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset {
    static id = 63280; // meta-0
    id = PackageDataAddDataAsset.id;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({ asset }) {
        if (asset.packageName === "") throw new Error("package name is required and cannot be empty");
        if (asset.packagePlatform === "") throw new Error("package platform is required and cannot be empty");
        if (asset.packageOwner === "") throw new Error("package owner is required and cannot be empty");
        if (asset.packageReleases === []) throw new Error("at least one release is required, the list can not be empty");
    };

    async apply({ asset, stateStore }) {
        let packageDataListBuffer = await stateStore.chain.get("packagedata:packageDataList");

        let { packageList } = codec.decode(PackageDataListSchema, packageDataListBuffer);
        if( packageList == []){
            packageList.push(asset);
        }

        // add missing package versions to package releases
        let packageFound = false, versionFound = false;
        packageList.forEach(function (entry) {
            if (entry.packageName === asset.packageName) {
                packageFound = true;
                asset.packageReleases.forEach(function (pRelease) {
                    entry.packageReleases.forEach(function (release){
                        if (release === pRelease) {
                            versionFound = true;
                        }
                    })
                    if (!versionFound) packageList.packageReleases.push(pRelease);
                });
            }
        });
        // if package is not yet in the package list, add it
        if (!packageFound) packageList.push(asset);

        console.log("check");

        await stateStore.chain.set("packagedata:" + asset.packageName, codec.encode(PackageDataListSchema, { packageData }));
    }
}