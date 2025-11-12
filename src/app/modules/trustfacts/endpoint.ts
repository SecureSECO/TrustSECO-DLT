import { Modules, Types, codec, StateMachine } from 'klayr-sdk';
import { TrustfactsMethod } from './method';
import { PackageDataMethod } from '../package_data/method';
import { StoreTrustFact, AddTrustFactSchema, TopPackageResult, TopPackage } from './stores/trustfacts';

export class TrustfactsEndpoint extends Modules.BaseEndpoint {
    private trustfactsMethod!: TrustfactsMethod;
    private packageDataMethod!: PackageDataMethod;
    
    public addDependecies(trustfactsMethod: TrustfactsMethod, packageDataMethod: PackageDataMethod) {
        this.trustfactsMethod = trustfactsMethod;
        this.packageDataMethod = packageDataMethod;
    }

	public async calculateTrustScore(context: Types.ModuleEndpointContext) {
		const { packageName, version, owner, platform } = context.params;
		if (typeof packageName !== "string")
			throw new Error("packageName should be string.")
		if (typeof version !== "string" && typeof version !== "undefined")
			throw new Error("version should be string or undefined.")
		if (typeof owner !== "string" && typeof owner !== "undefined")
			throw new Error("owner should be string or undefined.")
		if (typeof platform !== "string" && typeof platform !== "undefined")
			throw new Error("platform should be string or undefined.")
        return this._calculateTrustScore(context, { packageName, version, owner, platform });
	}

	public async getTopPackages(context: Types.ModuleEndpointContext): Promise<TopPackageResult> {
		const { descending, count } = context.params;
		if (typeof descending !== 'boolean') throw new Error('descending should be boolean.');
		if (typeof count !== 'number') throw new Error('count should be number.');

		const withScore = (await this._getAllTrustScores(context))
			.sort((a, b) => (descending ? b.score - a.score : a.score - b.score))
			.slice(0, count);
		return { packages: withScore };
	}

	/** Calculates trust score per category listed above */
	public async calculateCategoryTrustScores(context: Types.ModuleEndpointContext) {
		const { packageName, version, owner, platform } = context.params;
		if (typeof packageName !== "string")
			throw new Error("packageName should be string.")
		if (typeof version !== "string" && typeof version !== "undefined")
			throw new Error("version should be string or undefined.")
		if (typeof owner !== "string" && typeof owner !== "undefined")
			throw new Error("owner should be string or undefined.")
		if (typeof platform !== "string" && typeof platform !== "undefined")
			throw new Error("platform should be string or undefined.")

		const facts = await this.trustfactsMethod.getTrustFacts(context, {packageName, packageOwner: owner, packagePlatform: platform, packageRelease: version});

		const categoryScores: Record<string, number> = {};
		for (const { category, growthRate, midpoint } of categories) {
			const categoryFacts = this.getRelevantFacts(facts, version, category);
			const occurences = this.findOccurenceOfTrustFacts(categoryFacts);
			const score = this.combineFactsIntoScore(categoryFacts, occurences);
			const squashedScore = this.squashTrustScore(score, growthRate, midpoint);
			categoryScores[category] = squashedScore;
		}
		return categoryScores;
	}

	public encodeTrustFact(context: Types.ModuleEndpointContext) {
		return codec.encode(AddTrustFactSchema, context.params).toString('hex');
	}

	public async getPackageFacts(context: Types.ModuleEndpointContext) {
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
	
	private async _getAllTrustScores(
		context: StateMachine.ImmutableMethodContext,
	): Promise<TopPackage[]> {
		const allFacts = await this.trustfactsMethod.getAllTrustFacts(context);
		const packageFacts: Record<string, StoreTrustFact[]> = {};
		for (const fact of allFacts) {
			if (packageFacts[fact.packageName] === undefined) {
				packageFacts[fact.packageName] = [fact];
			} else {
				packageFacts[fact.packageName].push(fact);
			}
		}
		const packages = await this.packageDataMethod.getAllPackages(context);
		return packages.packages
			.map(pack => {
				const score = this._calculateTrustScoreWithFacts(packageFacts[pack.packageName]);
				if (typeof score !== 'number') return null;
				return {
					...pack,
					score,
				};
			})
			.filter(pack => pack !== null);
	}
    
    private async _calculateTrustScore(context: StateMachine.ImmutableMethodContext, pack: { packageName: string; version: string | undefined; owner: string | undefined; platform: string | undefined }): Promise<number> {
        const { packageName, version, owner, platform } = pack;
		let facts = await this.trustfactsMethod.getTrustFacts(context, {packageName, packageOwner: owner, packagePlatform: platform, packageRelease: version});
		facts = this.getRelevantFacts(facts, version);
		return this._calculateTrustScoreWithFacts(facts);
    }

	private _calculateTrustScoreWithFacts(facts: StoreTrustFact[]): number {
		const occurences = this.findOccurenceOfTrustFacts(facts);
		const score = this.combineFactsIntoScore(facts, occurences);
		const squashedScore = this.squashTrustScore(score, 0.02, 50);
		return squashedScore;
	}

    /** combines all the trustfacts into a single score */
    private combineFactsIntoScore(facts: StoreTrustFact[], occurences: Record<string, number>) {
        let score = 0;
        for (const fact of facts) {
            // TODO: maybe replace occurences_count by amount of facts, this way packages wont get rewarded only having a few facts
            const occurencesCount = occurences[fact.fact];
            if (occurencesCount === undefined) throw new Error(`Could not find occurence of trust fact ${  fact.fact}`);
            const factScore = scores.find(s => s.fact === fact.fact) ?? { fact: "", weight: 0, average: 1, log: false }
            let factValue = parseFloat(fact.factData);
            factValue = factScore.log ? Math.max(Math.log(factValue), 0) : factValue;
            const {weight} = factScore;
            const average = factScore.log ? Math.log(factScore.average) : factScore.average;
            if (!Number.isNaN(factValue))
            {
                score += (factValue * weight / average) / occurencesCount;
            }
        }
        return score;       
    }

    /** Reduce a score to a number between 0 and 100 using the logistic function */
    private squashTrustScore(score: number, growthRate: number, midpoint: number) {
        return 100/(1 + Math.E ** (-growthRate*(score-midpoint)));
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
    { category: "Community and Popularity",       growthRate: 0.02, midpoint: 12 },
    { category: "Security",                       growthRate: 0.02, midpoint: -110 },
    { category: "Project Health and Maintenance", growthRate: 0.03, midpoint: -40 },
    { category: "Dependencies and Ecosystem",     growthRate: 0.05, midpoint: 35 },
]
