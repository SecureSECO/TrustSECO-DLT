import { BaseModule, codec } from 'lisk-sdk';
import { CodaJobList, codaJobListSchema, CodaReturnJob } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';
import { requiredBounty } from '../math';

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
                jobID: jobs[randomNumber].jobID,
                bounty: jobs[randomNumber].bounty,
                account: jobs[randomNumber].account
            };
            return returnJob;
        },
        getMinimumRequiredBounty: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            const totalBounty = jobs.reduce((acc, job) => acc + job.bounty, BigInt(0));

            const activeSpiders = 2; // todo; number of unique spiders that have sent in facts recently
            const networkCapacity = 100; // todo; amount of facts sent in recently
            
            return requiredBounty(totalBounty, networkCapacity, activeSpiders);
        }
    }

    async afterGenesisBlockApply({ stateStore }) {
        const jobsBuffer = codec.encode(codaJobListSchema, { jobs: [] });
        await stateStore.chain.set("coda:jobs", jobsBuffer);
    }
}