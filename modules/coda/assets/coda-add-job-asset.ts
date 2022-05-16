import { BaseAsset, codec } from 'lisk-sdk';

import { codaJobListSchema, codaJobSchema, validFacts } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    static id = 26320; // coda-0
    id = CodaAddJobAsset.id;
    name = 'AddJob';
    schema = codaJobSchema;

    validate({asset}) {
        if (asset.package.trim() === "") throw new Error("Package cannot be empty");
        if (!validFacts.hasOwnProperty(asset.source)) throw new Error("Unknown source");
        if (!validFacts[asset.source].includes(asset.fact)) throw new Error("Unknown fact for this source");
    }
    
    async apply({ asset, stateStore }) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs");
        const { jobs } = codec.decode(codaJobListSchema, jobsBuffer);
        jobs.push(asset);
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }
}
