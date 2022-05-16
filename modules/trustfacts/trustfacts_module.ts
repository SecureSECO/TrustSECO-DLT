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
        // GET ALL THE TRUSTFACTS FOR A SPECIFIC PACKAGE
        getPackageInfo: async ({packageName} : Record<string, unknown>) => {
            console.log(packageName);
            //get facts buffer for the given package
            const trustFactsBuffer:any = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //if it is defined, decode facts buffer
            if (trustFactsBuffer !== undefined) {
                const { facts } = codec.decode<{ 
                    facts: {
                        jobID: number,
                        factData: string,
                        gitSignature: string,
                        keyURL: string
                    }[]}>(trustFactsListSchema, trustFactsBuffer);
                //if facts are available, return them
                return facts;
            }
            else throw new Error("There are no trust-facts available for this package");
        }
    }

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } }) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            const fact = codec.decode<{}>(TrustFactsSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }
    }
}