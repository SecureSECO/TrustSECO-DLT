import { BaseAsset, codec } from 'lisk-sdk';

import { TrustFactsSchema, trustFactsListSchema } from '../trustfacts_schema';

export class TrustFactsAddFactAsset extends BaseAsset {
    static id = 12340;
    id = TrustFactsAddFactAsset.id;
    name = 'AddFacts';
    schema = TrustFactsSchema;

    validate({ asset }) {
        // for now onlycheck if fields are not empty, TODO more logic
        
        //TODO: validate data and gpg key
        if (asset.factData === "") throw new Error("Data cannot be empty");

    };

    async apply({ asset, stateStore }) {
        let trustFactsBuffer = await stateStore.chain.get("trustfacts:facts");
        let { facts } = codec.decode(trustFactsListSchema, trustFactsBuffer);

        facts.push(asset);

        await stateStore.chain.set("trustfacts:facts", codec.encode(trustFactsListSchema, { facts }));


    }
}