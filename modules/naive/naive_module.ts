/* eslint-disable class-methods-use-this */
import {
    BaseModule,
    codec,
    AfterGenesisBlockApplyContext,
    TransactionApplyContext
} from 'lisk-sdk';
import { FactMessageAsset } from "./assets/fact_message_asset";

import { trustFactAssetSchema } from './schemas';

export interface TrustFactsAssetProps {
    TrustFactsJSON: "Trust Facts:"
}

export class NaiveModule extends BaseModule {
    public actions = {
  
    };
    public reducers = {
  
    };
    public name = 'naive';
    public transactionAssets = [new FactMessageAsset()];
    public events = [
        'newTrustFact'
    ];
    public id = 1001;

    public accountSchema = {
        type: 'object',
        properties: {
            trustFacts: {
                fieldNumber: 1,
                dataType: 'string',
                maxLength: 1024,
            },
        },
        default: {
            trustFacts: 'TrF: ',
        },
    };
    // Lifecycle hooks

    public async afterTransactionApply(_input: TransactionApplyContext) {
        // Get any data from stateStore using transaction info, below is an example
        // const sender = await _input.stateStore.account.getOrDefault<TokenAccount>(_input.transaction.senderAddress);
       // 1. Check for correct module and asset IDs
       if (_input.transaction.moduleID === this.id && _input.transaction.assetID === 1) {

           // 2. Decode the transaction asset
           const trustAsset: TrustFactsAssetProps = codec.decode(
               trustFactAssetSchema,
               _input.transaction.asset
           );

        // 3. Publish the event 'naive:newTrustFact' and
        // attach information about the sender address and the posted message.
        this._channel.publish('naive:newTrustFact', {
            sender: _input.transaction.senderAddress.toString('hex'),
            naive: trustAsset.TrustFactsJSON
        });
    }
    }

    public async afterGenesisBlockApply(_input: AfterGenesisBlockApplyContext) {
        // Get any data from genesis block, for example get all genesis accounts
        // const genesisAccounts = genesisBlock.header.asset.accounts;
        console.log(_input);
    }
}
