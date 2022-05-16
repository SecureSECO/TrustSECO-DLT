import { BaseModule, codec, TransactionApplyContext } from 'lisk-sdk';
import { TrustFact, TrustFactList, TrustFactSchema, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

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
            let trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //if it is defined, decode facts buffer
            if (trustFactsBuffer !== undefined){
                let { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                //if facts are available, return them
                return facts;
            }
            else throw new Error("There are no trust-facts available for this package");
        }
    }

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } } : TransactionApplyContext) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            let fact = codec.decode<TrustFact>(TrustFactSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }
    }
}