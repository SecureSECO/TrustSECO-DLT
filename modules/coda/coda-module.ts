import { BaseModule, codec } from 'lisk-sdk';
import { codaJobListSchema, codaJobSchema } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';

export class CodaModule extends BaseModule {
    static id = 2632; // the T9 code for "coda"
    id = CodaModule.id;
    name = 'coda';
    // INITIALIZE THE JOBS LIST (EMPTY)

    async afterGenesisBlockApply({ stateStore }) {
        const jobsBuffer = codec.encode(codaJobListSchema, { jobs: [] });
        await stateStore.chain.set( "coda:jobs", jobsBuffer );   
    }

    // TRANSACTIONS TO MODIFY THE JOBS LIST

    transactionAssets = [
        new CodaAddJobAsset()
    ];

    // ACTIONS TO GET THE CURRENT STATE OF THE JOBS LIST
    actions = {
        // GET THE JOBS LIST
        getJobs: async () => {
            const jobsBuffer:any = await this._dataAccess.getChainState("coda:jobs");
            return codec.decode(codaJobListSchema, jobsBuffer);
        },

        getRandomJob: async () => {
            const jobsBuffer:any = await this._dataAccess.getChainState("coda:jobs");
            const { jobs } = codec.decode<{
                jobs: {
                    package: string, 
                    source: string, 
                    fact: string
                }[]}>(codaJobListSchema, jobsBuffer);
            const randomNumber = Math.floor(Math.random() * jobs.length);
            return jobs[randomNumber];
        }
    }

    // PUBLISHING EVENTS WHEN NEW JOBS ARE ADDED
    // (not used in this module, or anywhere afaik)

    events = ['newJob'];

    public async afterTransactionApply({ transaction: {moduleID, assetID, asset} }) {
        if (moduleID === this.id && assetID === CodaAddJobAsset.id) {
            const job = codec.decode<{}>(codaJobSchema, asset);
            console.log('afterTransactionApply: job:', job);
            this._channel.publish('coda:newJob', job);
        }
    }
}