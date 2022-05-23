import { BaseModule, codec, TransactionApplyContext } from 'lisk-sdk';
import { CodaJob, CodaJobList, codaJobSchema, codaJobListSchema, CodaReturnJob } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';

export class CodaModule extends BaseModule {
    static id = 2632; // the T9 code for "coda"
    id = CodaModule.id;
    name = 'coda';

    // INITIALIZE THE JOBS LIST (EMPTY)

    async afterGenesisBlockApply({ stateStore }) {
        const jobsBuffer = codec.encode(codaJobListSchema, { jobs: [] });
        await stateStore.chain.set("coda:jobs", jobsBuffer);
    }

    // TRANSACTIONS TO MODIFY THE JOBS LIST
    transactionAssets = [
        new CodaAddJobAsset()
    ];

    // ACTIONS TO GET THE CURRENT STATE OF THE JOBS LIST
    actions = {
        // GET THE JOBS LIST
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
                jobID: jobs[randomNumber].jobID
            };
            return returnJob;
        }
    }

    // PUBLISHING EVENTS WHEN NEW JOBS ARE ADDED
    // (not used in this module, or anywhere afaik)

    events = ['newJob'];

    public async afterTransactionApply({ transaction: { moduleID, assetID, asset } }: TransactionApplyContext) {
        if (moduleID === this.id && assetID === CodaAddJobAsset.id) {
            const job = codec.decode<CodaJob>(codaJobSchema, asset);
            this._channel.publish('coda:newJob', job);
        }
    }
}