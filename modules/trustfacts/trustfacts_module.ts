import { Actions, BaseModule, codec } from 'lisk-sdk';
import { AddTrustFactSchema, StoreTrustFact, TrustFactList, TrustFactListSchema } from './trustfacts_schema'
import { TrustFactsAddFactAsset } from './assets/addfact_asset'

export class TrustFactsModule extends BaseModule {
    name = "trustfacts";
    transactionAssets = [
        new TrustFactsAddFactAsset()
    ];

    scores = [
        { fact: "gh_total_download_count",       weight: 63,     average: 2E4,  log: true,  category: "Community and Popularity" },
        { fact: "gh_owner_stargazer_count",      weight: 24.21,  average: 5000, log: true,  category: "Community and Popularity" },
        { fact: "cve_count",                     weight: -16.47, average: 2,    log: false, category: "Security" },
        { fact: "vs_virus_ratio",                weight: -16.47, average: 0.1,  log: false, category: "Security" },
        { fact: "lib_dependency_count",          weight: 8.04,   average: 20,   log: false, category: "Dependencies and Ecosystem" },
        { fact: "gh_contributor_count",          weight: 4.41,   average: 100,  log: true,  category: "Community and Popularity" },
        { fact: "lib_release_frequency",         weight: -2.32,  average: 1E7,  log: false, category: "Project Health and Maintenance" },

        // These scores aren't based on the paper but are made up
        { fact: "gh_user_count",                 weight: 60,     average: 1E5,  log: true,  category: "Dependencies and Ecosystem" },
        { fact: "gh_release_download_count",     weight: 1,      average: 300,  log: true,  category: "Community and Popularity" },
        { fact: "gh_yearly_commit_count",        weight: 15,     average: 50,   log: true,  category: "Project Health and Maintenance" },
        { fact: "gh_average_resolution_time",    weight: -4,     average: 4E4,  log: false, category: "Project Health and Maintenance" },
        { fact: "gh_gitstar_ranking",            weight: 1,      average: 600,  log: false, category: "Community and Popularity" },
        { fact: "gh_release_issues_count",       weight: 1,      average: 20,   log: false, category: "Project Health and Maintenance" },
        { fact: "gh_open_issues_count",          weight: 2,      average: 50,   log: false, category: "Project Health and Maintenance" },
        { fact: "gh_zero_response_issues_count", weight: -7,     average: 70,   log: false, category: "Project Health and Maintenance" },
        { fact: "gh_issue_ratio",                weight: -15,    average: 0.29, log: false, category: "Project Health and Maintenance" },
        { fact: "lib_contributor_count",         weight: 6,      average: 100,  log: true,  category: "Community and Popularity" },
        { fact: "lib_dependent_count",           weight: -1,     average: 5000, log: false, category: "Dependencies and Ecosystem" },
        { fact: "lib_release_count",             weight: 2,      average: 70,   log: true,  category: "Project Health and Maintenance" },
        { fact: "lib_sourcerank",                weight: 8,      average: 20,   log: false, category: "Project Health and Maintenance" },
        { fact: "so_popularity",                 weight: 18,     average: 0.05, log: true,  category: "Community and Popularity" },
    ]

    categories = [
        // growth rate and midpoint will be used in the logistic function
        { category: "Community and Popularity",       growth_rate: 0.02, midpoint: 12 },
        { category: "Security",                       growth_rate: 0.02, midpoint: -110 },
        { category: "Project Health and Maintenance", growth_rate: 0.03, midpoint: -40 },
        { category: "Dependencies and Ecosystem",     growth_rate: 0.05, midpoint: 35 },
    ]

    actions: Actions = {
        calculateTrustScore: async (record: Record<string, unknown>) => {
            // if version is left empty calculate trust score over all versions
            const { packageName, version } = record as { packageName: string, version: string | undefined };
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);

            if (trustFactsBuffer === undefined) return [];

            let { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
            facts = this.getRelevantFacts(facts, version);
            const occurences = this.findOccurenceOfTrustFacts(facts);
            const score = this.calculateTrustScore(facts, occurences);
            const squashedScore = this.squashTrustScore(score, 0.02, 50);
            return squashedScore;
        },
        /** Calculates trust score per category listed above */
        calculateCategoryTrustScores: async (record: Record<string, unknown>) => {
            // if version is left empty calculate trust score over all versions
            const { packageName, version } = record as { packageName: string, version: string | undefined };
            const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + packageName);

            if (trustFactsBuffer === undefined) return {};

            const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
            const categoryScores: Record<string, number> = {};
            for(const {category, growth_rate, midpoint} of this.categories) {
                const categoryFacts = this.getRelevantFacts(facts, version, category);
                const occurences = this.findOccurenceOfTrustFacts(categoryFacts);
                const score = this.calculateTrustScore(categoryFacts, occurences);
                const squashedScore = this.squashTrustScore(score, growth_rate, midpoint);
                categoryScores[category] = squashedScore;
            }
            return categoryScores;
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
    
    /** return only the facts for the current version and which are included in the trust score */
    getRelevantFacts(facts: StoreTrustFact[], version?: string, category?: string): StoreTrustFact[] {
        return facts.filter(fact =>
            (fact.version === version || version === undefined) &&
            this.scores.some(score => score.fact === fact.fact && 
                    (category === undefined || score.category === category))
        );
    }

    /** returns how often trustfacts occurs */
    findOccurenceOfTrustFacts(facts: StoreTrustFact[]): Record<string, number> {
        const trustFactOccurence: Record<string, number> = {};
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

    /** Reduce a score to a number between 0 and 100 using the logistic function */
    squashTrustScore(score: number, growth_rate: number, midpoint: number) {
        return 100/(1 + Math.pow(Math.E, -growth_rate*(score-midpoint)));
    }
}
