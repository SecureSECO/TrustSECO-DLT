import { BaseModule,codec, TransactionApplyContext } from "lisk-sdk";
import { CodaJobList, codaJobListSchema } from "../coda/coda-schemas";
import {  TrustFact, TrustFactList, TrustFactListSchema } from "../trustfacts/trustfacts_schema";

export class TrustScoreCalculation extends BaseModule {
    static id = 42069;
    id = TrustScoreCalculation.id;
    name = "trustScoreCalculation";

    factWeights: [factName: string, weight: number][] = []
    githubFactWeights: [factName: string, weight: number][] = [
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
    libraries_ioFactWeights: [factName: string, weight: number][] = []

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
                return await this.calculateTrustScore(facts);
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

    async calculateTrustScore(facts: TrustFact[]){
        let totalScore = 0.0;
        let totalTrustFactCount = 0.0;
        facts.forEach(async ({jobID, factData}) => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            const { source, fact } = jobs[jobID];
            if(source == "github")
                this.factWeights = this.githubFactWeights;
            else if (source == "libraries_io")
                this.factWeights = this.libraries_ioFactWeights;
            const trustfact = this.factWeights.find((factWeightTable)=>{return factWeightTable[0] == fact})
            switch(trustfact![0])
            {
                case "stars":
                                //  Score                       * Weight
                    totalScore +=   Number.parseFloat(factData) * trustfact![1];
                    totalTrustFactCount += trustfact![1];
                    console.log("stars");
                    break;
                case "forks":
                                //  Score * Weight
                    totalScore +=   1     * trustfact![1];
                    totalTrustFactCount += trustfact![1];
                    break;
                default:
                    console.log("default");

            }
            console.log("trustfact: " + trustfact![0] + " weighted for: " + trustfact![1]);
        });
        
        console.log(totalScore);
        console.log(totalTrustFactCount);
        console.log(totalScore/totalTrustFactCount);
        if(totalTrustFactCount > 0)
            return totalScore / totalTrustFactCount;
        return 0;
    }
}