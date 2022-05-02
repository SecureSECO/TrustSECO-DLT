import { BaseModule, AfterGenesisBlockApplyContext, TransactionApplyContext } from 'lisk-sdk';
import { FactMessageAsset } from "./assets/fact_message_asset";
export interface TrustFactsAssetProps {
    TrustFactsJSON: "Trust Facts:";
}
export declare class NaiveModule extends BaseModule {
    actions: {};
    reducers: {};
    name: string;
    transactionAssets: FactMessageAsset[];
    events: string[];
    id: number;
    accountSchema: {
        type: string;
        properties: {
            trustFacts: {
                fieldNumber: number;
                dataType: string;
                maxLength: number;
            };
        };
        default: {
            trustFacts: string;
        };
    };
    afterTransactionApply(_input: TransactionApplyContext): Promise<void>;
    afterGenesisBlockApply(_input: AfterGenesisBlockApplyContext): Promise<void>;
}
