import { BaseEndpoint, ModuleEndpointContext, codec } from 'klayr-sdk';
import { TrustfactsMethod } from './method';
import { StoreTrustFact, AddTrustFactSchema } from './stores/trustfacts';

export class TrustfactsEndpoint extends BaseEndpoint {
    private trustfactsMethod!: TrustfactsMethod;
    
    public addDependecies(trustfactsMethod: TrustfactsMethod) {
        this.trustfactsMethod = trustfactsMethod;
    }

	public async calculateTrustScore(context: ModuleEndpointContext) {
		const { packageName, version, owner, platform } = context.params;
		if (typeof packageName !== "string")
			throw new Error("packageName should be string.")
		if (typeof version !== "string" && typeof version !== "undefined")
			throw new Error("version should be string or undefined.")
		if (typeof owner !== "string" && typeof owner !== "undefined")
			throw new Error("owner should be string or undefined.")
		if (typeof platform !== "string" && typeof platform !== "undefined")
			throw new Error("platform should be string or undefined.")
		let facts = await this.trustfactsMethod.getTrustFacts(context, {packageName, packageOwner: owner, packagePlatform: platform, packageRelease: version});

		facts = this.getRelevantFacts(facts, version);
		const occurences = this.findOccurenceOfTrustFacts(facts);
		const score = this._calculateTrustScore(facts, occurences);
		const squashedScore = this.squashTrustScore(score, 0.02, 50);
		return squashedScore;
	}

	/** Calculates trust score per category listed above */
	public async calculateCategoryTrustScores(context: ModuleEndpointContext) {
		const { packageName, version, owner, platform } = context.params;
		if (typeof packageName !== "string")
			throw new Error("packageName should be string.")
		if (typeof version !== "string" && typeof version !== "undefined")
			throw new Error("version should be string or undefined.")
		if (typeof owner !== "string" && typeof owner !== "undefined")
			throw new Error("owner should be string or undefined.")
		if (typeof platform !== "string" && typeof platform !== "undefined")
			throw new Error("platform should be string or undefined.")

		let facts = await this.trustfactsMethod.getTrustFacts(context, {packageName, packageOwner: owner, packagePlatform: platform, packageRelease: version});

		const categoryScores: Record<string, number> = {};
		for (const { category, growth_rate, midpoint } of categories) {
			const categoryFacts = this.getRelevantFacts(facts, version, category);
			const occurences = this.findOccurenceOfTrustFacts(categoryFacts);
			const score = this._calculateTrustScore(categoryFacts, occurences);
			const squashedScore = this.squashTrustScore(score, growth_rate, midpoint);
			categoryScores[category] = squashedScore;
		}
		return categoryScores;
	}

	public async encodeTrustFact(context: ModuleEndpointContext) {
		return codec.encode(AddTrustFactSchema, context.params).toString('hex');
	}

	public async getPackageFacts(context: ModuleEndpointContext) {
		const { packageName, version, owner, platform } = context.params;
		if (typeof packageName !== "string")
			throw new Error("packageName should be string.")
		if (typeof version !== "string" && typeof version !== "undefined")
			throw new Error("version should be string or undefined.")
		if (typeof owner !== "string" && typeof owner !== "undefined")
			throw new Error("owner should be string or undefined.")
		if (typeof platform !== "string" && typeof platform !== "undefined")
			throw new Error("platform should be string or undefined.")

		return { facts: await this.trustfactsMethod.getTrustFacts(context, {packageName, packageOwner: owner, packagePlatform: platform, packageRelease: version}) };
	}

    /** return only the facts for the current version and which are included in the trust score */
    private getRelevantFacts(facts: StoreTrustFact[], version?: string, category?: string): StoreTrustFact[] {
        return facts.filter(fact =>
            (fact.version === version || version === undefined) &&
            scores.some(score => score.fact === fact.fact && 
                    (category === undefined || score.category === category))
        );
    }

    /** returns how often trustfacts occurs */
    private findOccurenceOfTrustFacts(facts: StoreTrustFact[]): Record<string, number> {
        const trustFactOccurence: Record<string, number> = {};
        for (const score of scores) {
            const occurence = facts.filter(fact => fact.fact === score.fact).length;
            trustFactOccurence[score.fact] = occurence;
        }
        return trustFactOccurence;
    }

    /** combines all the trustfacts into a single score */
    private _calculateTrustScore(facts: StoreTrustFact[], occurences: Record<string, number>) {
        let score = 0;
        for (const fact of facts) {
            // TODO: maybe replace occurences_count by amount of facts, this way packages wont get rewarded only having a few facts
            const occurences_count = occurences[fact.fact];
            if (occurences_count == undefined) throw new Error("Could not find occurence of trust fact " + fact.fact);
            const fact_score = scores.find(score => score.fact === fact.fact) ?? { fact: "", weight: 0, average: 1, log: false }
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
    private squashTrustScore(score: number, growth_rate: number, midpoint: number) {
        return 100/(1 + Math.pow(Math.E, -growth_rate*(score-midpoint)));
    }
}

const scores = [
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

const categories = [
    // growth rate and midpoint will be used in the logistic function
    { category: "Community and Popularity",       growth_rate: 0.02, midpoint: 12 },
    { category: "Security",                       growth_rate: 0.02, midpoint: -110 },
    { category: "Project Health and Maintenance", growth_rate: 0.03, midpoint: -40 },
    { category: "Dependencies and Ecosystem",     growth_rate: 0.05, midpoint: 35 },
]
