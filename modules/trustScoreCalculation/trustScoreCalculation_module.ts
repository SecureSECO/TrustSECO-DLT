import { BaseModule,codec, TransactionApplyContext } from "lisk-sdk";
import { CodaJobList, codaJobListSchema } from "../coda/coda-schemas";
import {  TrustFactList, TrustFactListSchema } from "../trustfacts/trustfacts_schema";

export class TrustScoreCalculation extends BaseModule {
    static id = 42069;
    id = TrustScoreCalculation.id;
    name = "trustScoreCalculation";

    factWeight: [factName: string, weight: number][] = [
                                        ["documentation",5],
                                        ["downloads",4.5],
                                        ["stars",4],
                                        ["vulnerabilities", 4],
                                        ["release",4],
                                        ["commit frequency",3],
                                        ["closed issue",3],
                                        ["usage",3],
                                        ["test code",3],
                                        ["dependencies",3],
                                        ["contributors",3],
                                        ["build status",3],
                                        ["website", 3],
                                        ["watchers",3],
                                        ["badges",2],
                                        ["forks",2]
                                    ];

    transactionAssets = [];

    actions = {
        // Calculate the TrustScore for a specific package
        calculateTrustScore: async ({packageName} : Record<string, unknown>) => {
            console.log(packageName);
            //get facts buffer for the given package
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //if it is defined, decode facts buffer
            if (trustFactsBuffer !== undefined){
                const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                //if facts are available, return the trust score
                return this.calculateTrustScore(facts);
            }
            else throw new Error("There are no trust-facts available for this package");
            
        }
    }

    events = [];

    public async afterTransactionApply ({ transaction: {moduleID} } : TransactionApplyContext) {
        if(moduleID ==this.id) {
            console.log("done with trustscore calculation");
        }
    }

    async calculateTrustScore(facts){
        console.log("step 1 in calculation");
        (await facts).forEach(async ({jobID}) => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            console.log(jobID);
            console.log(jobs);
            const { fact } = jobs[jobID];
            console.log(fact);
            const trustfact = await this.factWeight.find((factWeightTable)=>{return factWeightTable[0] == fact})
            console.log(trustfact);
            console.log("trustfact: " + trustfact![0] + " weighted for: " + trustfact![1]);
        });
    }
}