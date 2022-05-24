import { BaseAsset, codec } from "lisk-sdk";
import { PackageDataSchema, PackageData } from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset {
    static id = 63280; // meta-0
    id = PackageDataAddDataAsset.id;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({ asset }) {
        asset = this.formatAsset({ asset });
        if (asset.packageName === "") throw new Error("package name is required and cannot be empty");
        if (asset.packagePlatform === "") throw new Error("package platform is required and cannot be empty");
        if (asset.packageOwner === "") throw new Error("package owner is required and cannot be empty");
        if (asset.packageReleases === []) throw new Error("at least one release is required, the list can not be empty");
    }

    async apply({ asset, stateStore }) {
        // Prevents users from adding duplicate packages, differentiated by whitespaces
        asset = this.formatAsset({ asset });

        // Get package data if available
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.packageName);
        let packageData: PackageData = { packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [""] };

        // Add all new added versions of the package
        if (packageDataBuffer !== undefined) {
            packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
            let versionFound = false;

            asset.packageReleases.forEach(function (pRelease) {
                packageData.packageReleases.forEach(function (release) {
                    if (release === pRelease.trim()) {
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

    formatAsset({ asset }) {
        asset.packageName = asset.packageName.trim();
        asset.packageName = asset.packageName.toLowerCase();
        asset.packagePlatform = asset.packagePlatform.trim();
        asset.packagePlatform = asset.packagePlatform.toLowerCase();
        asset.packageOwner = asset.packageOwner.trim();
        asset.packageOwner = asset.packageOwner.toLowerCase();
        asset.packageReleases = asset.packageReleases.map(version =>
            version.replace(/[^\d.-]/g, ''));
        return asset;
    }
}