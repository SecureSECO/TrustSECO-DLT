import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';

import { CodaJob, CodaJobList, codaJobSchema, codaJobListSchema, validFacts } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    static id = 26320; // coda-0
    id = CodaAddJobAsset.id;
    name = 'AddJob';
    schema = codaJobSchema;

    validate({asset} : ValidateAssetContext<CodaJob>) {
        const date = new Date(asset.date);
        if (asset.package.trim() === "") throw new Error("Package cannot be empty");
        if (!Object.keys(validFacts).includes(asset.source)) throw new Error("Unknown source");
        if (!validFacts[asset.source].includes(asset.fact)) throw new Error("Unknown fact for this source");
        if (isNaN(date.getDate())) throw new Error("Invalid date specified (year-month-day, hours and more specific are optional)");
        if (isNaN(asset.jobID)) throw new Error("Given job ID is not a number");
    }

    async apply({ asset, stateStore } : ApplyAssetContext<CodaJob>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

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
