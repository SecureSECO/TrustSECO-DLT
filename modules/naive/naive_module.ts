/* eslint-disable class-methods-use-this */
import {
    BaseModule,
    codec,
    AfterGenesisBlockApplyContext,
    TransactionApplyContext
} from 'lisk-sdk';
import { FactMessageAsset } from "./assets/fact_message_asset";

const {
    trustFactAssetSchema
} = require('./schemas');

export interface TrustFactsAssetProps {
    TrustFactsJSON: "Trust Facts:"
}

export class NaiveModule extends BaseModule {
    public actions = {
        // Example below
        // getBalance: async (params) => this._dataAccess.account.get(params.address).token.balance,
        // getBlockByID: async (params) => this._dataAccess.blocks.get(params.id),
    };
    public reducers = {
        // Example below
        // getBalance: async (
		// 	params: Record<string, unknown>,
		// 	stateStore: StateStore,
		// ): Promise<bigint> => {
		// 	const { address } = params;
		// 	if (!Buffer.isBuffer(address)) {
		// 		throw new Error('Address must be a buffer');
		// 	}
		// 	const account = await stateStore.account.getOrDefault<TokenAccount>(address);
		// 	return account.token.balance;
		// },
    };
    public name = 'naive';
    public transactionAssets = [new FactMessageAsset()];
    public events = [
        'newTrustFact'
        // Example below
        // 'naive:newBlock',
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

    // public constructor(genesisConfig: GenesisConfig) {
    //     super(genesisConfig);
    // }

    // Lifecycle hooks

    public async afterTransactionApply(_input: TransactionApplyContext) {
        // Get any data from stateStore using transaction info, below is an example
        // const sender = await _input.stateStore.account.getOrDefault<TokenAccount>(_input.transaction.senderAddress);
       // 1. Check for correct module and asset IDs
       if (_input.transaction.moduleID === this.id && _input.transaction.assetID === 1) {

           // 2. Decode the transaction asset
           let trustAsset: TrustFactsAssetProps;
           trustAsset = codec.decode(
               trustFactAssetSchema,
               _input.transaction.asset
           );

        // 3. Publish the event 'hello:newHello' and
        // attach information about the sender address and the posted hello message.
        this._channel.publish('naive:newTrustFact', {
            sender: _input.transaction.senderAddress.toString('hex'),
            naive: trustAsset.TrustFactsJSON
        });
    }
    }

    public async afterGenesisBlockApply(_input: AfterGenesisBlockApplyContext) {
        // Get any data from genesis block, for example get all genesis accounts
        // const genesisAccounts = genesisBlock.header.asset.accounts;
    }
}
