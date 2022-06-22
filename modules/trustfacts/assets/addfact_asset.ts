import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema } from '../../coda/coda-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { AddTrustFact, StoreTrustFact, TrustFactList, AddTrustFactSchema, TrustFactListSchema } from '../trustfacts_schema';
import { GPG } from '../../../common/gpg-verification';

export class TrustFactsAddFactAsset extends BaseAsset {
    id = 32280;
    name = 'AddFacts';
    schema = SignedSchema(AddTrustFactSchema);

    validate({ asset }: ValidateAssetContext<Signed<AddTrustFact>>) {
        if (asset.data.factData.trim() === "") throw new Error("FactData cannot be empty");
        if (!asset.signature) throw new Error("Signature is missing!");

        GPG.verify(asset, AddTrustFactSchema);
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<AddTrustFact>>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        const job = jobs.find(job => { 
            if (job.jobID === asset.data.jobID) return true;
            else throw new Error("Job with given job ID does not exist!");
        });
        
        let facts: StoreTrustFact[] = [];
        const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job!.package);
        if (trustFactsBuffer !== undefined) {
            facts = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer).facts;
        }
            
        // check if this account already has a fact for this job
        const uid = GPG.verify(asset, AddTrustFactSchema);
        const existingFact = facts.find(fact => fact.account.uid === uid && fact.jobID === asset.data.jobID);
        if (existingFact !== undefined) throw new Error("Account already has a fact for this job");

        facts.push({ 
            fact: job!.fact, 
            factData: asset.data.factData, 
            version: job!.version, 
            keyURL: asset.data.keyURL, 
            jobID: asset.data.jobID,
            account: { uid }
        });
        
        await stateStore.chain.set("trustfacts:" + job!.package, codec.encode(TrustFactListSchema, { facts }));
    }
}