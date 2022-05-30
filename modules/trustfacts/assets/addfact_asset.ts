import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema } from '../../coda/coda-schemas';

import { AddTrustFact, StoreTrustFact, TrustFactList, AddTrustFactSchema, TrustFactListSchema } from '../trustfacts_schema';

export class TrustFactsAddFactAsset extends BaseAsset {
    id = 32280;
    name = 'AddFacts';
    schema = AddTrustFactSchema;

    validate({ asset }: ValidateAssetContext<AddTrustFact>) {
        if (asset.jobID < 0) throw new Error("JobID can't be negative");
        if (asset.factData.trim() === "") throw new Error("FactData cannot be empty");
        if (asset.gitSignature.trim() === "") throw new Error("GitSignature cannot be empty");
        if (asset.keyURL.trim() === "") throw new Error("KeyUrl cannot be empty");
    }

    async apply({ asset, stateStore }: ApplyAssetContext<AddTrustFact>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        const job = jobs.find(job => job.jobID === asset.jobID);

        if (job !== undefined) {
            // get the facts for this package
            let facts: StoreTrustFact[] = [];

            const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
            if (trustFactsBuffer !== undefined) {
                facts = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer).facts;
            }

            const newFact: StoreTrustFact = { 
                fact: job.fact, 
                factData: asset.factData, 
                version: job.version, 
                keyURL: asset.keyURL, 
                jobID: asset.jobID 
            };
            facts.push(newFact);

            // Count how often the fact has already been spidered for this particular job, remove the job after a certain threshold
            const count = facts.filter(fact =>
                fact.fact === asset.fact && fact.jobID == asset.jobID).length;
            if (count > 9) {
                jobs = jobs.filter(job => job.jobID != asset.jobID);
                await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
            }

            await stateStore.chain.set("trustfacts:" + job.package, codec.encode(TrustFactListSchema, { facts }));
        } else {
            throw new Error("Job with given job ID does not exist!");
        }
    }
}