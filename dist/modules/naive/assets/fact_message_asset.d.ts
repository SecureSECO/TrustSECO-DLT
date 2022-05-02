import { BaseAsset } from 'lisk-sdk';
export declare class FactMessageAsset extends BaseAsset {
    name: string;
    id: number;
    schema: {
        $id: string;
        type: string;
        required: string[];
        properties: {
            trustFactJSON: {
                dataType: string;
                fieldNumber: number;
                minLength: number;
                maxLength: number;
            };
        };
    };
    validate({ asset }: {
        asset: any;
    }): void;
    apply({ asset, transaction, stateStore }: {
        asset: any;
        transaction: any;
        stateStore: any;
    }): Promise<void>;
}
