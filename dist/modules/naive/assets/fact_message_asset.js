"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactMessageAsset = void 0;
const lisk_sdk_1 = require("lisk-sdk");
class FactMessageAsset extends lisk_sdk_1.BaseAsset {
    constructor() {
        super(...arguments);
        this.name = 'factMessage';
        this.id = 1;
        this.schema = {
            $id: 'lisk/naive/asset',
            type: 'object',
            required: ["trustFactJSON"],
            properties: {
                trustFactJSON: {
                    dataType: 'string',
                    fieldNumber: 1,
                    minLength: 3,
                    maxLength: 10000,
                },
            },
        };
    }
    validate({ asset }) {
        if (asset.trustFactJSON == "") {
            throw new Error('Illegal message: ${asset.trustFactJSON}');
        }
    }
    async apply({ asset, transaction, stateStore }) {
        const senderAddress = transaction.senderAddress;
        const senderAccount = await stateStore.account.get(senderAddress);
        senderAccount.naive.trustFacts += asset.trustFactJSON;
        stateStore.account.set(senderAccount.address, senderAccount);
    }
}
exports.FactMessageAsset = FactMessageAsset;
//# sourceMappingURL=fact_message_asset.js.map