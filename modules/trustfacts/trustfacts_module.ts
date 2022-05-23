import { BaseModule, codec, TransactionApplyContext } from 'lisk-sdk';
import { TrustFact, TrustFactList, TrustFactSchema, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    id = 3228;
    name = "trustfacts";

    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];

    actions = {
        // GET ALL THE TRUSTFACTS FOR A SPECIFIC PACKAGE
        getPackageFacts: async ({ packageName }: Record<string, unknown>) => {
            console.log("Get trustfacts for package: " + packageName);
            //get facts buffer for the given package
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //if it is defined, decode facts buffer
            if (trustFactsBuffer !== undefined) {
                const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                //if facts are available, return them
                return facts;
            }
            else throw new Error("There are no trust-facts available for this package");
        }
    }

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } }: TransactionApplyContext) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            const fact = codec.decode<TrustFact>(TrustFactSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }
    }
}