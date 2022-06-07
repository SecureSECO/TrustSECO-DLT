import { BaseModule, codec } from 'lisk-sdk';
import { TrustFactList, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    id = 3228;
    name = "trustfacts";
    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];
    scores = {
        gh_total_download_count: 63,
        gh_owner_stargazer_count: 24.21,
        cve_count: -16.47,
        lib_dependency_count: 8.04,
        gh_contributor_count: 4.41,
        lib_release_frequency: 2.32
    }
    trustFactOccurence: any = []

    actions = {
        getPackageFacts: async ({ packageName }: Record<string, unknown>) => {
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            if (trustFactsBuffer !== undefined) {
                return codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
            }
            else throw new Error("There are no trust-facts available for this package");
        },
        calculateTrustScore: async ({ packageName, version }: Record<string, unknown>) => {
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);   
            if (trustFactsBuffer !== undefined) {
                let { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                facts = this.getRelevantFacts(facts, version);
                this.findOccurenceOfTrustFacts(facts);
                const score = this.calculateTrustScore(facts);
                const squashedScore = this.squashTrustScore(score);
                return squashedScore;
            }
            else throw new Error("The given package does not exist"); 
        }
    }
    
    getRelevantFacts(facts, version) {
        return facts.filter(fact => {
            return Object.prototype.hasOwnProperty.call(this.scores, fact.fact) && fact.version === version;
        }); 
    }

    findOccurenceOfTrustFacts(facts) {
        // Count how often data is added for a trust fact contained in the scores object
        // Store the results in the trustFactOccurance array
        Object.keys(this.scores).forEach(score => {
            const occurence = facts.filter(factObject => {
                return factObject.fact === score
            }).length;
            
            const obj: any = {}
            obj[score] = occurence;
            this.trustFactOccurence.push(obj);
        });
    }

    calculateTrustScore(facts) {
        let score = 0;
        facts.map(fact => {
            const occurenceObject = this.trustFactOccurence.find((x: any) => x[fact.fact]);
            const occurenceValue: any = Object.values(occurenceObject)[0];
            const factValue = parseInt(fact.factData);
            console.log(this.trustFactOccurence);
            score += (factValue * this.scores[fact.fact]) / occurenceValue;
        });
        return score;       
    }

    squashTrustScore(score) {
        // Reduce a score to a number between 0 and 100 using the logistic function:
        // f(x) = 200/(1 + e^-x) - 100. For f(5) = ~98.66. The trust score can get large
        // very quickly, so we take g(x) = log(x) / log(10000) first. This way, the trust score has to 
        // approach 10000^5 before it gets a rating of around 100. So trust score = f(g(x)).
        const g = Math.log(score) / Math.log(10000);
        const f = 200/(1 + Math.pow(Math.E, -g)) - 100;
        return f;
    }
}