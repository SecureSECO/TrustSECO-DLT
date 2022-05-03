import { BaseModule, codec } from 'lisk-sdk';
import { TrustFactsSchema, trustFactsListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    id = 1234;
    name = "trustfacts";

    async afterGenesisBlockApply({ stateStore }) {
        let trustFactsBuffer = codec.encode(trustFactsListSchema, { facts: [] });
        await stateStore.chain.set("trustfacts:facts", trustFactsBuffer);
    }

    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];


    actions = {
        // GET THE FACTS LIST
        getFacts: async () => {
            let trustFactsBuffer:any = await this._dataAccess.getChainState("trustfacts:facts");
            return codec.decode(trustFactsListSchema, trustFactsBuffer);
        }
    };

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } }) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            let fact = codec.decode<{}>(TrustFactsSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }

    }


}