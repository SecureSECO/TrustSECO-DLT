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
        { fact: "gh_total_download_count",       weight: 63,     average: 1E4,  log: true },
        { fact: "gh_owner_stargazer_count",      weight: 24.21,  average: 5000, log: true },
        { fact: "cve_count",                     weight: -16.47, average: 2,    log: false },
        { fact: "vs_virus_ratio",                weight: -16.47, average: 0.1,  log: false },
        { fact: "lib_dependency_count",          weight: 8.04,   average: 20,   log: false },
        { fact: "gh_contributor_count",          weight: 4.41,   average: 100,  log: true },
        { fact: "lib_release_frequency",         weight: 2.32,   average: 1E7,  log: false },

        // These scores aren't based on the paper but are made up
        { fact: "gh_user_count",                 weight: 60,     average: 1E5,  log: true },
        { fact: "gh_release_download_count",     weight: 1,      average: 100,  log: true },
        { fact: "gh_yearly_commit_count",        weight: 15,     average: 50,   log: true },
        { fact: "gh_open_issues_count",          weight: 2,      average: 50,   log: false },
        { fact: "gh_zero_response_issues_count", weight: -12,    average: 15,   log: false },
        { fact: "gh_issue_ratio",                weight: -15,    average: 0.29, log: false },
        { fact: "lib_contributor_count",         weight: 6,      average: 100,  log: true },
        { fact: "lib_dependent_count",           weight: -1,     average: 5000, log: false },
        { fact: "lib_release_count",             weight: 2,      average: 70,   log: true },
        { fact: "so_popularity",                 weight: 18,     average: 1E5,  log: true },
    ]

    actions: Actions = {
        calculateTrustScore: async (record: Record<string, unknown>) => {
            const { packageName, version } = record as { packageName: string, version: string };
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);
            if (trustFactsBuffer !== undefined) {
                let { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                facts = this.getRelevantFacts(facts, version);
                let occurences = this.findOccurenceOfTrustFacts(facts);
                const score = this.calculateTrustScore(facts, occurences);
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
    
    /** return only the facts for the current version and which contain a numeric value */
    getRelevantFacts(facts: StoreTrustFact[], version: string): StoreTrustFact[] {
        return facts.filter(fact =>
            fact.version === version &&
            this.scores.some(score => score.fact === fact.fact)
        );
    }

    /** returns how often trustfacts occurs */
    findOccurenceOfTrustFacts(facts: StoreTrustFact[]): Record<string, number> {
        let trustFactOccurence: Record<string, number> = {};
        for (const score of this.scores) {
            const occurence = facts.filter(fact => fact.fact === score.fact).length;
            trustFactOccurence[score.fact] = occurence;
        }
        return trustFactOccurence;
    }

    /** combines all the trustfacts into a single score */
    calculateTrustScore(facts: StoreTrustFact[], occurences: Record<string, number>) {
        let score = 0;
        for (const fact of facts) {
            const occurences_count = occurences[fact.fact];
            if (occurences_count == undefined) throw new Error("Could not find occurence of trust fact " + fact.fact);
            const fact_score = this.scores.find(score => score.fact === fact.fact) ?? { fact: "", weight: 0, average: 1, log: false }
            let factValue = parseFloat(fact.factData);
            factValue = fact_score.log ? Math.max(Math.log(factValue), 0) : factValue;
            const weight = fact_score.weight;
            const average = fact_score.log ? Math.log(fact_score.average) : fact_score.average;
            if (!isNaN(factValue))
            {
                score += (factValue * weight / average) / occurences_count;
            }
        }
        return score;       
    }

    /** Reduce a score to a number between 0 and 100 using the logistic function: */
    squashTrustScore(score: number) {
        return 100/(1 + Math.pow(Math.E, -0.004*(score-50)));
    }
}
