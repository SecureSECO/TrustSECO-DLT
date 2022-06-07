import { BaseModule, codec } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema, CodaReturnJob, minimalCodaJobSchema } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';

export class CodaModule extends BaseModule {
    id = 2632; 
    name = "coda";
    transactionAssets = [
        new CodaAddJobAsset()
    ];

    actions = {
        getJobs: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            return codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        },
        getRandomJob: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            const randomNumber = Math.floor(Math.random() * jobs.length);
            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:" + jobs[randomNumber].package) as Buffer;
            const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
            const returnJob: CodaReturnJob = {
                packageName: jobs[randomNumber].package,
                packagePlatform: packageData.packagePlatform,
                packageOwner: packageData.packageOwner,
                packageRelease: jobs[randomNumber].version,
                fact: jobs[randomNumber].fact,
                jobID: jobs[randomNumber].jobID
            };
            return returnJob;
        },
        encodeCodaJob: async (asset: Record<string, unknown>) => {
            return codec.encode(minimalCodaJobSchema, asset).toString('hex');
        }
    }

    async afterGenesisBlockApply({ stateStore }) {
        const jobsBuffer = codec.encode(codaJobListSchema, { jobs: [] });
        await stateStore.chain.set("coda:jobs", jobsBuffer);
    }
}