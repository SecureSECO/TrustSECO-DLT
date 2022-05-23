import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { PackageDataSchema } from '../../packagedata/packagedata-schemas';

import { CodaJob, CodaJobList, codaJobSchema, codaJobListSchema/*, validFacts*/ } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    static id = 26320; // coda-0
    id = CodaAddJobAsset.id;
    name = 'AddJob';
    schema = codaJobSchema;

    validate({ asset }: ValidateAssetContext<CodaJob>) {
        const date = new Date(asset.date);
        if (asset.package.trim() === "") throw new Error("Package cannot be empty");
        if (asset.version.trim() === "") throw new Error("version cannot be empty");
        if (asset.fact.trim() === "") throw new Error("Fact cannot be empty");
        //if (!Object.keys(validFacts).includes(asset.source)) throw new Error("Unknown source");
        //if (!validFacts[asset.source].includes(asset.fact)) throw new Error("Unknown fact for this source");
        if (isNaN(date.getDate())) throw new Error("Invalid date specified (year-month-day, hours and more specific are optional)");
        if (isNaN(asset.jobID)) throw new Error("Given job ID is not a number");

    }

    async apply({ asset, stateStore }: ApplyAssetContext<CodaJob>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // Check if package is in packagedata and if version exists
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.package) as Buffer;
        if (packageDataBuffer === undefined) {
            throw new Error("The given package does not exist in the packageData!");
        }
        let packageData = { packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [""] };
        packageData = codec.decode<{ packageName: "", packagePlatform: "", packageOwner: "", packageReleases: [] }>(PackageDataSchema, packageDataBuffer);
        let versionFound = false;
        packageData.packageReleases.forEach(function (version) {
            if (asset.version === version) {
                versionFound = true;
            }
        });
        if (!versionFound) {
            throw new Error("The given package version does not exist in the packageData!");
        }



        if (jobs.filter(job => job.jobID == asset.jobID).length > 0) {
            throw new Error("The given job ID already exists for a job, no two jobs can have the same ID!");
        }
        jobs.push(asset);

        // If a job has been longer in the job list for a specified number of days, remove it
        const currentDate = new Date();
        jobs = jobs.filter(job => {
            const jobDate = new Date(job.date);
            const differenceInMilliSeconds = currentDate.getTime() - jobDate.getTime();
            const differenceInDays = Math.ceil(differenceInMilliSeconds / (1000 * 60 * 60 * 24));
            return differenceInDays <= 365;
        });

        // If the job list exceeds the maximum number of allowed jobs, remove the oldest ones (current jobs - number of allowed jobs).
        const maximumCodaJobs = 100000;
        if (jobs.length > maximumCodaJobs) {
            jobs.sort((jobOne, jobTwo) => {
                return new Date(jobOne.date).valueOf() - new Date(jobTwo.date).valueOf();
            });
            jobs.splice(0, jobs.length - maximumCodaJobs);
        }

        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }
}
