import { Actions, BaseModule, codec } from 'lisk-sdk';
import { AddTrustFactSchema, StoreTrustFact, TrustFactList, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    id = 3228;
    name = "trustfacts";
    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];

    scores = [
        { fact: "gh_total_download_count", weight: 63 },
        { fact: "gh_owner_stargazer_count", weight: 24.21 },
        { fact: "cve_count", weight: -16.47 },
        { fact: "virus_ratio", weight: -16.47 },
        { fact: "lib_dependency_count", weight: 8.04 },
        { fact: "gh_contributor_count", weight: 4.41 },
        { fact: "lib_release_frequency", weight: 2.32 },

        // These scores aren't based on the paper but are made up
        { fact: "gh_user_count", weight: 60 },
        { fact: "gh_release_download_count", weight: 48 },
        { fact: "gh_yearly_commit_count", weight: 15 },
        { fact: "gh_repository_language", weight: 3 },
        { fact: "gh_open_issues_count", weight: 34 },
        { fact: "gh_zero_response_issues_count", weight: -12 },
        { fact: "gh_issue_ratio", weight: -15 },
        { fact: "lib_contributor_count", weight: 6 },
        { fact: "lib_dependent_count", weight: 7 },
        { fact: "lib_latest_release_date", weight: 1 },
        { fact: "lib_release_count", weight: 2 },
        { fact: "so_popularity", weight: 30 },
    ]

    trustFactOccurence: {[x: string]: number}[] = []

    actions: Actions = {
        calculateTrustScore: async (record: Record<string, unknown>) => {
            const { packageName, version } = record as { packageName: string, version: string };
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            if (trustFactsBuffer !== undefined) {
                let { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                facts = this.getRelevantFacts(facts, version);
                this.findOccurenceOfTrustFacts(facts);
                const score = this.calculateTrustScore(facts);
                const squashedScore = this.squashTrustScore(score);
                return squashedScore;
            }
            else return [];
        },
        encodeTrustFact: async (asset: Record<string, unknown>) => {
            return codec.encode(AddTrustFactSchema, asset).toString('hex');
        },
        getPackageFacts: async (record: Record<string, unknown>) => {
            const { packageName } = record as { packageName: string };
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            if (trustFactsBuffer !== undefined) {
                return codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
            }
            else return [];
        },
    }
    
    getRelevantFacts(facts: StoreTrustFact[], version: string) {
        return facts.filter(fact =>
            fact.version === version &&
            this.scores.some(score => score.fact === fact.fact)
        );
    }

    findOccurenceOfTrustFacts(facts: StoreTrustFact[]) {
        // Count how often data is added for a trust fact contained in the scores object
        // Store the results in the trustFactOccurance array
        for (const score of this.scores) {
            const occurence = facts.filter(fact => fact.fact === score.fact).length;
            this.trustFactOccurence.push({[score.fact]: occurence});
        }
    }

    calculateTrustScore(facts: StoreTrustFact[]) {
        let score = 0;
        for (const fact of facts) {
            const occurenceObject = this.trustFactOccurence.find(occ => occ[fact.fact]);
            if (occurenceObject == undefined) throw new Error("Could not find occurence of trust fact " + fact.fact);
            const occurenceValue = Object.values(occurenceObject)[0];
            const factValue = parseInt(fact.factData);
            const weight = this.scores.find(score => score.fact === fact.fact)?.weight ?? 0;
            score += (factValue * weight) / occurenceValue;
        }
        return score;       
    }

    squashTrustScore(score: number) {
        // Reduce a score to a number between 0 and 100 using the logistic function:
        // f(x) = 200/(1 + e^(-x * 0.8)) - 100. The trust score can get large
        // very quickly given the many variables involed in calculating the score, so we 
        // take g(x) = log(x) / log(100) first. So trust score = f(g(x)).
        const g = Math.log(score) / Math.log(100);
        const f = 200/(1 + Math.pow(Math.E, -g*0.8)) - 100;
        return f;
    }
}