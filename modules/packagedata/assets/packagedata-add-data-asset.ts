import { BaseAsset, codec } from "lisk-sdk";
import { PackageDataSchema, PackageData } from "../packagedata-schemas";
import { CodaJobList, codaJobListSchema, CodaJob, validFacts } from '../../coda/coda-schemas';

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
            const newReleases = asset.packageReleases.filter(release => {
                return !packageData.packageReleases.includes(release)});

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
        // Store
        await stateStore.chain.set("packagedata:" + asset.packageName, codec.encode(PackageDataSchema, packageData));
    }

    async addJobsForAllFacts({ asset, stateStore }, version) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        const sources = Object.keys(validFacts);
        sources.forEach(source => {
            validFacts[`${source}`].forEach((fact: any) => {
                const job: CodaJob = {
                    package: asset.packageName,
                    version: version,
                    fact: fact,
                    date: new Date().toString(),
                    jobID: this.generateRandomNumber()
                }
                const duplicateIdCheck = jobs.filter(oldJob => oldJob.jobID == job.jobID).length > 0;
                while (duplicateIdCheck) {
                    job.jobID = this.generateRandomNumber();
                }
                jobs.push(job);
            });
        });
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
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