"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaiveModule = void 0;
const lisk_sdk_1 = require("lisk-sdk");
const fact_message_asset_1 = require("./assets/fact_message_asset");
const { trustFactAssetSchema } = require('./schemas');
class NaiveModule extends lisk_sdk_1.BaseModule {
    constructor() {
        super(...arguments);
        this.actions = {};
        this.reducers = {};
        this.name = 'naive';
        this.transactionAssets = [new fact_message_asset_1.FactMessageAsset()];
        this.events = [
            'newTrustFact'
        ];
        this.id = 1001;
        this.accountSchema = {
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
    }
    async afterTransactionApply(_input) {
        if (_input.transaction.moduleID === this.id && _input.transaction.assetID === 1) {
            let trustAsset;
            trustAsset = lisk_sdk_1.codec.decode(trustFactAssetSchema, _input.transaction.asset);
            this._channel.publish('naive:newTrustFact', {
                sender: _input.transaction.senderAddress.toString('hex'),
                naive: trustAsset.TrustFactsJSON
            });
        }
    }
    async afterGenesisBlockApply(_input) {
    }
}
exports.NaiveModule = NaiveModule;
//# sourceMappingURL=naive_module.js.map