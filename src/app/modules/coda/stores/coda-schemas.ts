/* eslint-disable max-classes-per-file */
import { Schema , Modules } from 'klayr-sdk';
import { AccountId, AccountIdSchema } from '../../accounts/stores/account-id';

export const validFacts: { source: string; facts: string[] }[] = [
	{
		source: 'github',
		facts: [
			'gh_contributor_count',
			'gh_user_count',
			'gh_total_download_count',
			'gh_release_download_count',
			'gh_yearly_commit_count',
			'gh_repository_language',
			'gh_gitstar_ranking',
			'gh_open_issues_count',
			'gh_zero_response_issues_count',
			'gh_release_issues_count',
			'gh_issue_ratio',
			'gh_average_resolution_time',
			'gh_owner_stargazer_count',
		],
	},
	{
		source: 'libraries_io',
		facts: [
			'lib_release_frequency',
			'lib_contributor_count',
			'lib_dependency_count',
			'lib_dependent_count',
			'lib_latest_release_date',
			'lib_first_release_date',
			'lib_release_count',
			'lib_sourcerank',
		],
	},
	{
		source: 'cve',
		facts: ['cve_count', 'cve_vulnerabilities'],
	},
	{
		source: 'stackoverflow',
		facts: ['so_popularity'],
	},
	{
		source: 'virusscanner',
		facts: ['vs_virus_ratio'],
	},
];

export interface CodaJob {
	package: string;
	version: string;
	fact: string;
	date: string;
	jobID: number;
	bounty: bigint;
	account: AccountId;
}

export interface MinimalCodaJob {
	package: string;
	version: string;
	fact: string;
	bounty: bigint;
}

export function isMinimalCodaJob(obj: Record<string, unknown>): boolean {
    // Why is this not build into typescript
	return (
		typeof obj.package === 'string' &&
		typeof obj.version === 'string' &&
		typeof obj.fact === 'string' &&
		typeof obj.bounty === 'string'
	);
}

export const codaJobSchema: Schema = {
	$id: 'coda/add-job',
	type: 'object',
	required: ['package', 'version', 'fact', 'date', 'jobID'],
	properties: {
		// package of the trustfact (e.g. "microsoft/terminal")
		package: {
			dataType: 'string',
			fieldNumber: 1,
		},
		// The version of the package this trustfact applies to
		version: {
			dataType: 'string',
			fieldNumber: 2,
		},
		// the type of fact (e.g. "stars")
		fact: {
			dataType: 'string',
			fieldNumber: 3,
		},
		date: {
			dataType: 'string',
			fieldNumber: 4,
		},
		jobID: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		bounty: {
			dataType: 'uint64',
			fieldNumber: 6,
		},
		account: {
			...AccountIdSchema,
			fieldNumber: 7,
		},
	},
};

export const codaJobIdSchema: Schema = {
	$id: 'coda/job-id',
	type: 'object',
	required: ['jobId'],
	properties: {
		jobId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};

export const codaJobListSchema: Schema = {
	$id: 'coda/job-list',
	type: 'object',
	required: ['jobs'],
	properties: {
		jobs: {
			type: 'array',
			fieldNumber: 1,
			items: codaJobSchema,
		},
	},
};

export const minimalCodaJobSchema: Schema = {
	$id: 'coda/add-minimal-job',
	type: 'object',
	required: ['package', 'version', 'fact', 'bounty'],
	properties: {
		package: {
			dataType: 'string',
			fieldNumber: 1,
		},
		version: {
			dataType: 'string',
			fieldNumber: 2,
		},
		fact: {
			dataType: 'string',
			fieldNumber: 3,
		},
		bounty: {
			dataType: 'uint64',
			fieldNumber: 4,
		},
	},
};

/** Key used to access the keys, needed because klayr data storage is key-value based */
export const jobListKey = Buffer.alloc(0);

export class CodaJobListStore extends Modules.BaseStore<CodaJobList> {
	public schema = codaJobListSchema;
}

export interface CodaJobList {
	jobs: CodaJob[];
}

export const jobIdKey = Buffer.alloc(0);

export interface CodaJobId {
	jobId: number;
}

export class CodaJobIdStore extends Modules.BaseStore<CodaJobId> {
	public schema = codaJobIdSchema;
}
