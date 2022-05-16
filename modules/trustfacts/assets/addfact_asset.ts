import { BaseAsset, codec } from 'lisk-sdk';
import { codaJobListSchema } from '../../coda/coda-schemas';

import { TrustFactsSchema, trustFactsListSchema } from '../trustfacts_schema';

export class TrustFactsAddFactAsset extends BaseAsset {
    static id = 12340;
    id = TrustFactsAddFactAsset.id;
    name = 'AddFacts';
    schema = TrustFactsSchema;

    validate({ asset }) {
        // for now onlycheck if fields are not empty, TODO more logic
        
        //TODO: validate data and gpg key
        if (asset.factData.trim() === "") throw new Error("Data cannot be empty");
    }

    async apply({ asset, stateStore }) {

        // get the job
        const jobsBuffer = await stateStore.chain.get("coda:jobs");
        const { jobs } = codec.decode<{jobs:[{package:string}]}>(codaJobListSchema, jobsBuffer);
        const { package : pack } = jobs[asset.jobID];

        // get the facts for this package
        let facts : {}[] = [];
        
        const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + pack);
        if (trustFactsBuffer !== undefined) {
            facts = codec.decode<{facts:[]}>(trustFactsListSchema, trustFactsBuffer).facts;
        }

        // add the new fact
        facts.push(asset);

        // store!
        await stateStore.chain.set("trustfacts:" + pack, codec.encode(trustFactsListSchema, { facts }));
    }
}