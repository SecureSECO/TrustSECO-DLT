import { BaseModule, codec } from 'lisk-sdk';
import { CodaJob, CodaJobList, codaJobListSchema, minimalCodaJobSchema } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';
import { requiredBounty } from '../math';
import { TrustFactList, TrustFactListSchema } from '../trustfacts/trustfacts_schema';

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

            if (jobs.length === 0) throw new Error("No jobs available");

            const totalBounty = jobs.reduce((count, job) => count + job.bounty, BigInt(0));

            // random BigInt less than totalBounty
            let rand = BigInt(Math.random() * 2**64) * totalBounty / BigInt(2**64);

            let job! : CodaJob;
            for (job of jobs) {
                rand -= job.bounty;
                if (rand < 0) break;
            }

            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:" + job.package) as Buffer;
            const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);

            return { ...job, ...packageData };
        },
        getMinimumRequiredBounty: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

            let totalBounty = BigInt(0);
            let totalFacts = 0;
            const spideringAccounts: Set<string> = new Set();

            for (const job of jobs) {
                totalBounty += job.bounty;
                const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + job.package);
                if (trustFactsBuffer != undefined) {
                    const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                    totalFacts += facts.length;
                    for (const fact of facts) {
                        spideringAccounts.add(fact.account.uid);
                    }
                }
            }

            const uniqueActiveSpiders = spideringAccounts.size;
            const networkCapacity = totalFacts;
            
            return requiredBounty(totalBounty, networkCapacity, uniqueActiveSpiders);
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