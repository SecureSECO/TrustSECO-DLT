import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { PackageDataSchema, PackageData, PackageDataListSchema, PackageDataList } from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset {
    id = 63280;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({ asset } : ValidateAssetContext<PackageData>) {
        // Prevents users from adding duplicate packages, differentiated by whitespaces
        if (asset.packageName !== asset.packageName.trim()) throw new Error("package name cannot start or end with whitespace");
        if (asset.packageName !== asset.packageName.toLowerCase()) throw new Error("package name must be lowercase");
        if (asset.packagePlatform !== asset.packagePlatform.trim()) throw new Error("package platform cannot start or end with whitespace");
        if (asset.packagePlatform !== asset.packagePlatform.toLowerCase()) throw new Error("package platform must be lowercase");
        if (asset.packageOwner !== asset.packageOwner.trim()) throw new Error("package owner cannot start or end with whitespace");
        if (asset.packageOwner !== asset.packageOwner.toLowerCase()) throw new Error("package owner must be lowercase");
        for (const version of asset.packageReleases) {
            if (version.replace(/[^\d.-]/g, '') !== version) throw new Error("package release must be a valid version number");
        }

        if (asset.packageName === "") throw new Error("package name is required and cannot be empty");
        if (asset.packagePlatform === "") throw new Error("package platform is required and cannot be empty");
        if (asset.packageOwner === "") throw new Error("package owner is required and cannot be empty");
        if (asset.packageReleases.length === 0) throw new Error("at least one release is required, the list can not be empty");
    }

    async apply({ asset, stateStore } : ApplyAssetContext<PackageData>) {

        // Get the buffers for the package data and all packages in parallel
        const packageDataBuffer$ = stateStore.chain.get("packagedata:" + asset.packageName);
        const allPackagesBuffer$ = stateStore.chain.get("packagedata:allPackages");
        const packageDataBuffer = await packageDataBuffer$;
        const allPackagesBuffer = await allPackagesBuffer$ as Buffer;

        let packageData: PackageData = { packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [""] };
        let packageIsNew = true;
        let newReleases : string[] = []

        // Add all new added versions of the package
        if (packageDataBuffer !== undefined) {
            packageIsNew = false;
            packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
            newReleases = asset.packageReleases.filter(release => {
                return !packageData.packageReleases.includes(release)});

            newReleases.forEach(release => packageData.packageReleases.push(release));
        }
        // If package is new, add it
        else {
            packageData = asset;
        }

        const { packages } = codec.decode<PackageDataList>(PackageDataListSchema, allPackagesBuffer);
        if (packageIsNew) {
            packages.push(packageData);
        } else {
            packages.map(_package => {
                if (_package.packageName == asset.packageName) {
                    newReleases.forEach(release =>
                        _package.packageReleases.push(release))
                }
            })
        }

        await Promise.all([
            stateStore.chain.set("packagedata:" + asset.packageName, codec.encode(PackageDataSchema, packageData)),
            stateStore.chain.set("packagedata:allPackages", codec.encode(PackageDataListSchema, { packages }))
        ]);
    }
}