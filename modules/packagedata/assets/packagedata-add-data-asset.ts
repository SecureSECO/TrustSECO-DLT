import { BaseAsset, codec } from 'lisk-sdk';
import { PackageDataSchema, PackageData, PackageDataListSchema, PackageDataList } from "../packagedata-schemas";

export class PackageDataAddDataAsset extends BaseAsset {
    id = 63280;
    name = 'AddPackageData';
    schema = PackageDataSchema;

    validate({ asset }) {
        asset = this.formatAsset({ asset });
        if (asset.packageName === "") throw new Error("package name is required and cannot be empty");
        if (asset.packagePlatform === "") throw new Error("package platform is required and cannot be empty");
        if (asset.packageOwner === "") throw new Error("package owner is required and cannot be empty");
        if (asset.packageReleases.length === 0 ||
            asset.packageReleases.join(' ').trim() === '') throw new Error("at least one release is required, the list can not be empty");
    }

    async apply({ asset, stateStore }) {
        // Prevents users from adding duplicate packages, differentiated by whitespaces
        asset = this.formatAsset({ asset });
        
        // Get the buffers for the package data and all packages
        const [packageDataBuffer, allPackagesBuffer] = await Promise.all([
            stateStore.chain.get("packagedata:" + asset.packageName) as Buffer,
            stateStore.chain.get("packagedata:allPackages") as Buffer
        ]);
        
        let packageData: PackageData = { packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [""] };
        let packageIsNew = true;
        let newReleases = []

        // Add all new added versions of the package
        if (packageDataBuffer !== undefined) {
            packageIsNew = false;
            packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
            newReleases = asset.packageReleases.filter(release => {
                return !packageData.packageReleases.includes(release)});

            newReleases.forEach(release => packageData.packageReleases.push(release));
            for (const release of newReleases) {
                await this.addJobsForAllFacts({ asset, stateStore}, release);
            }
        }
        // If package is new, add it
        else {
            packageData = asset;
            for (const release of packageData.packageReleases) {
                await this.addJobsForAllFacts({ asset, stateStore}, release);
            }
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

    async addJobsForAllFacts({ asset, stateStore }, version) {
        console.error("jobs cannot be added, since no bounty is provided");
        
        // make the linter happy:
        asset; stateStore; version;

        return;

        // const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        // const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // const sources = Object.keys(validFacts);
        // sources.forEach(source => {
        //     validFacts[`${source}`].forEach((fact: any) => {
        //         const job: CodaJob = {
        //             package: asset.packageName,
        //             version: version,
        //             fact: fact,
        //             date: new Date().toString(),
        //             jobID: this.generateRandomNumber()
        //         }
        //         const duplicateIdCheck = jobs.filter(oldJob => oldJob.jobID == job.jobID).length > 0;
        //         while (duplicateIdCheck) {
        //             job.jobID = this.generateRandomNumber();
        //         }
        //         jobs.push(job);
        //     });
        // });
        // await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
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

    generateRandomNumber() {
        return Math.floor(Math.random() * (Math.pow(2, 32) - 1));
    }
}