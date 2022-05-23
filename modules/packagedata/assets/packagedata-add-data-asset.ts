import { BaseAsset, codec } from "lisk-sdk";
import { PackageDataSchema } from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset {
    static id = 63280; // meta-0
    id = PackageDataAddDataAsset.id;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({ asset }) {
        if (asset.packageName.trim() === "") throw new Error("package name is required and cannot be empty");
        if (asset.packagePlatform.trim() === "") throw new Error("package platform is required and cannot be empty");
        if (asset.packageOwner.trim() === "") throw new Error("package owner is required and cannot be empty");
        if (asset.packageReleases.trim() === []) throw new Error("at least one release is required, the list can not be empty");
    }

    async apply({ asset, stateStore }) {

        // Get package data if available
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.packageName);
        let packageData = { packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [""] };

        // Add all new added versions of the package
        if (packageDataBuffer !== undefined) {
            packageData = codec.decode<{ packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [] }>(PackageDataSchema, packageDataBuffer);
            let versionFound = false;

            asset.packageReleases.forEach(function (pRelease) {
                packageData.packageReleases.forEach(function (release) {
                    if (release === pRelease) {
                        versionFound = true;
                    }
                })
                if (!versionFound) {
                    packageData.packageReleases.push(pRelease);
                }
                versionFound = false;
            });
        }
        // If package is new, add it
        else {
            packageData = asset;
        }

        // Store
        await stateStore.chain.set("packagedata:" + asset.packageName, codec.encode(PackageDataSchema, packageData));
    }
}