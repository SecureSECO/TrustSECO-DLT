import { Schema, BaseStore } from "klayr-sdk";

export interface PackageData {
    packageName: string,
    packagePlatform: string,
    packageOwner: string,
    packageReleases: string[],
}

export const PackageDataSchema: Schema = {
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

    }
}

export interface PackageDataList {
    packages: PackageData[];
}

export const PackageDataListSchema: Schema = {
    $id: 'packagedata/package-list',
    type: 'object',
    required: ["packages"],
    properties: {
        packages: {
            type: 'array',
            fieldNumber: 1,
            items: PackageDataSchema
        }
    }
}

export class PackageDataListStore extends BaseStore<PackageDataList> {
    public schema = PackageDataListSchema;
}

/** Key used to access the keys, needed because klayr data storage is key-value based */
export const packageListKey = Buffer.alloc(0);
