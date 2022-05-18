import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';

import { CodaJob, CodaJobList, codaJobSchema, codaJobListSchema, validFacts } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    static id = 26320; // coda-0
    id = CodaAddJobAsset.id;
    name = 'AddJob';
    schema = codaJobSchema;

    validate({asset} : ValidateAssetContext<CodaJob>) {
        if (asset.package.trim() === "") throw new Error("Package cannot be empty");
        if (!Object.keys(validFacts).includes(asset.source)) throw new Error("Unknown source");
        if (!validFacts[asset.source].includes(asset.fact)) throw new Error("Unknown fact for this source");
    }

    async apply({ asset, stateStore } : ApplyAssetContext<CodaJob>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        jobs.push(asset);

        // If the job list exceeds the maximum number of allowed jobs, remove the oldest ones (current jobs - number of allowed jobs).
        const maximumCodaJobs = 3;
        if (jobs.length > maximumCodaJobs) {
            jobs.sort((jobOne, jobTwo) => {
                return new Date(jobOne.date).valueOf() - new Date(jobTwo.date).valueOf();
            });
            jobs.splice(0, jobs.length - maximumCodaJobs);
        }

        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }
}
