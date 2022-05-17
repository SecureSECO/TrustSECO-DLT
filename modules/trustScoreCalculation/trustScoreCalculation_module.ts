import { BaseModule, codec, TransactionApplyContext } from "lisk-sdk";
import { TrustFactsModule } from "../trustfacts/trustfacts_module";
import config = require('../../config/config.json');
import { TrustFactList } from "../trustfacts/trustfacts_schema";

export class TrustScoreCalculation extends BaseModule {
    static id = 42069;
    id = TrustScoreCalculation.id;
    name = "trustScoreCalculation";

    transactionAssets = [];

    actions = {
        // Calculate the TrustScore for a specific package
        calculateTrustScore: async ({packageName} : Record<string, unknown>) => {
            console.log(packageName);
            const buffer = new TrustFactsModule(config.genesisConfig);
            const facts = buffer.actions.getPackageInfo({packageName: 1});
            return this.calculateTrustScore(facts);
            (await facts).forEach((e,i)=>{
                console.log(i + ": " + e);
            });
        }
    }

    events = [];

    public async afterTransactionApply ({ transaction: {moduleID} } : TransactionApplyContext) {
        if(moduleID ==this.id) {
            console.log("done with trustscore calculation");
        }
    }

    calculateTrustScore(facts){
        facts.forEach((element, index) => {
            console.log(element);
        });
    }
}