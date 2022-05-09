import { BaseModule, codec } from 'lisk-sdk';
import { TrustFactsSchema, trustFactsListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'
//import { codaJobListSchema } from '../coda/coda-schemas';

export class TrustFactsModule extends BaseModule {
    id = 1234;
    name = "trustfacts";

    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];

    actions = {
        // GET THE FACTS LIST
        getFacts: async () => {
            let trustFactsBuffer:any = await this._dataAccess.getChainState("trustfacts:facts");
            return codec.decode(trustFactsListSchema, trustFactsBuffer);
        },

        // GET ALL THE TRUSTFACTS FOR A SPECIFIC PACKAGE
        getPackageInfo: async (packageName/*: Record<string, unknown>*/) => {
            //get facts buffer for the given package
            let trustFactsBuffer:any = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //decode facts buffer
            let {facts} = codec.decode<{facts:{jobID:number,factData:string,gitSignature:string,keyURL:string}[]}>(trustFactsListSchema, trustFactsBuffer);
            //if facts are available, return them
            if(facts.length > 0) return facts;
            else throw new Error("There are no trust-facts available for this package");
        }
    }

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } }) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            let fact = codec.decode<{}>(TrustFactsSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }
    }
}