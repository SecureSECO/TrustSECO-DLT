import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema } from '../../coda/coda-schemas';

import { TrustFact, TrustFactList, TrustFactSchema, TrustFactListSchema } from '../trustfacts_schema';

export class TrustFactsAddFactAsset extends BaseAsset {
    static id = 12340;
    id = TrustFactsAddFactAsset.id;
    name = 'AddFacts';
    schema = TrustFactSchema;

    validate({ asset } : ValidateAssetContext<TrustFact>) {
        // for now onlycheck if fields are not empty, TODO more logic
        
        //TODO: validate data and gpg key
        if (asset.factData.trim() === "") throw new Error("Data cannot be empty");
    }

    async apply({ asset, stateStore } : ApplyAssetContext<TrustFact>) {

        // get the job
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        const { package : pack } = jobs[asset.jobID];

        // get the facts for this package
        let facts : TrustFact[] = [];
        
        const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + pack);
        if (trustFactsBuffer !== undefined) {
            facts = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer).facts;
        }

        // add the new fact
        facts.push(asset);

        // store!
        await stateStore.chain.set("trustfacts:" + pack, codec.encode(TrustFactListSchema, { facts }));
    }
}