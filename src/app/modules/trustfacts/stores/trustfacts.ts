import { Schema, Modules } from 'klayr-sdk';
import { AccountId, AccountIdSchema } from '../../accounts/stores/account-id';

export interface AddTrustFact {
	jobID: number;
	factData: string;
}

export interface StoreTrustFact {
	fact: string;
	packageName: string;
	factData: string;
	version: string;
	jobID: number;
	account: AccountId;
}

export interface TrustFactList {
	facts: StoreTrustFact[];
}

export const AddTrustFactSchema: Schema = {
	$id: 'trustfacts/add-facts',
	type: 'object',
	required: ['jobID', 'factData'],
	properties: {
		// ID of job in CODA
		jobID: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		// The data that was spidered
		factData: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};

export const StoreTrustFactSchema: Schema = {
	$id: 'trustfacts/store-facts',
	type: 'object',
	required: ['fact', 'factData', 'version', 'jobID', 'account', 'packageName'],
	properties: {
		// the fact that was spidered
		fact: {
			dataType: 'string',
			fieldNumber: 1,
		},
		// The data that was spidered
		factData: {
			dataType: 'string',
			fieldNumber: 2,
		},
		// The version of the package the trustfact was gathered for
		version: {
			dataType: 'string',
			fieldNumber: 3,
		},
		// The name of the package the trustfact was gathered for
		packageName: {
			dataType: 'string',
			fieldNumber: 4,
		},
		// ID of job in CODA
		jobID: {
			dataType: 'uint32',
			fieldNumber: 5,
		},
		// The account that sent in the fact
		account: {
			...AccountIdSchema,
			fieldNumber: 6,
		},
	},
};

export const TrustFactListSchema: Schema = {
	$id: 'trustfacts/facts-list',
	type: 'object',
	required: ['facts'],
	properties: {
		facts: {
			type: 'array',
			fieldNumber: 1,
			items: StoreTrustFactSchema,
		},
	},
};

export const RequestSchema: Schema = {
	$id: 'trustfacts/request-schema',
	type: 'object',
	required: ['packageName'],
	properties: {
		packageName: {
			dataType: 'string',
			fieldNumber: 1,
		},
		version: {
			dataType: 'string',
			fieldNumber: 2,
		},
		owner: {
			dataType: 'string',
			fieldNumber: 3,
		},
		platform: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};

export class TrustFactsStore extends Modules.BaseStore<TrustFactList> {
	public schema = TrustFactListSchema;
}

export const trustFactsIndex = Buffer.alloc(0);

export const TopPackageSchema: Schema = {
    $id: 'packagedata/add-data',
    type: 'object',
    required: ["packageName", "packagePlatform", "packageOwner", "packageReleases"],
    properties: {
        // ID name of package
        packageName: {
            dataType: 'string',
            fieldNumber: 1
        },
        // Platform the package is hosted on (e.g. GitHub)
        packagePlatform: {
            dataType: 'string',
            fieldNumber: 2
        },
        // Owner (account name) of the package on the platform
        packageOwner: {
            dataType: 'string',
            fieldNumber: 3
        },
        // A list of all versions that have been released (e.g. 'v.1.22.1')
        packageReleases: {
            type: 'array',
            fieldNumber: 4,
            items: {
                dataType: 'string'
            }
        },
        // Trustscore of the package
        score: {
            dataType: 'number',
            fieldNumber: 5
        },
    }
}

export interface TopPackage {
    packageName: string,
    packagePlatform: string,
    packageOwner: string,
    packageReleases: string[],
    score: number,
}


export interface TopPackageResult {
    packages: TopPackage[];
}

export const TopPackageResultSchema: Schema = {
    $id: 'packagedata/package-list',
    type: 'object',
    required: ["packages"],
    properties: {
        packages: {
            type: 'array',
            fieldNumber: 1,
            items: TopPackageSchema
        }
    }
}
