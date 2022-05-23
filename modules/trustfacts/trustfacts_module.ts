import { BaseModule, codec, TransactionApplyContext } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema } from "../coda/coda-schemas";
import { TrustFact, TrustFactList, TrustFactSchema, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    id = 3228;
    name = "trustfacts";

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


    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];

    actions = {
        // GET ALL THE TRUSTFACTS FOR A SPECIFIC PACKAGE
        getPackageInfo: async ({packageName} : Record<string, unknown>)=>{
            return await this.getTrustFacts(packageName)
        },
        // Calculate the TrustScore for a specific package
        calculateTrustScore: async ({packageName} : Record<string, unknown>) => {
            const facts = await this.getTrustFacts(packageName);
                return await this.calculateTrustScore(facts);
        }       
    }

    events = ['newFact'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } } : TransactionApplyContext) {
        if (moduleID === this.id && assetID === TrustFactsAddFactAsset.id) {
            const fact = codec.decode<TrustFact>(TrustFactSchema, asset);
            console.log('afterTransactionApply: fact:', fact);
            this._channel.publish('trustfacts:newFact', fact);
        }
    }

    // Get all the TrustFacts of a package
    async getTrustFacts(packageName){
            console.log(packageName);
            //get facts buffer for the given package
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            //if it is defined, decode facts buffer
            if (trustFactsBuffer !== undefined){
                const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                //if facts are available, return them
                return facts;
            }
            else throw new Error("There are no trust-facts available for this package");
    }

    async calculateTrustScore(facts: TrustFact[]){
        let totalScore = 0.0;
        let totalTrustFactCount = 0.0;
        const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        facts.forEach(({jobID, factData}) => {
            const { source, fact } = jobs[jobID];
            if(source == "github")
                this.factWeights = this.githubFactWeights;
            else if (source == "libraries_io")
                this.factWeights = this.libraries_ioFactWeights;
            const trustfact = this.factWeights.find((factWeightTable)=>{return factWeightTable[0] == fact})
            switch(trustfact![0])
            {
                case "stars":
                    // Calculation for github stars score
                    // Number of stars * weight of the fact
                                //  Score                       * Weight
                    totalScore +=   Number.parseFloat(factData) * trustfact![1];
                    console.log("stars");
                    break;
                case "forks":
                    // Calculation for forks score
                    const countForks = Number.parseInt(factData);
                    switch(true)
                    {
                        case countForks > 50:
                            // Add score * weight
                            totalScore += 5 * trustfact![1];
                            break;
                        case countForks > 25:
                            totalScore += 4 * trustfact![1];
                            break;
                        case countForks > 10:
                            totalScore += 3 * trustfact![1];
                            break;
                        case countForks > 5:
                            totalScore += 2 * trustfact![1];
                            break;
                        case countForks > 0:
                            totalScore += 1 * trustfact![1];
                            break;
                        default:
                            console.log("0 forks");
                    }
                    console.log("forks")
                    break;
                default:
                    throw new Error("Calculation for trustscore missing for this fact");
            }
            totalTrustFactCount += trustfact![1];
        });

        // Check for dividing by 0 in case no facts were found
        if(totalTrustFactCount > 0)
            return totalScore / totalTrustFactCount;
        return 0;
    }
}