import { BaseModule, codec } from 'lisk-sdk';
import { CodaJob, CodaJobList, codaJobListSchema, minimalCodaJobSchema } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';
import { randomBigInt, requiredBounty } from '../math';
import { TrustFactList, TrustFactListSchema } from '../trustfacts/trustfacts_schema';
import { coda } from '../test-data';

export class CodaModule extends BaseModule {
    id = 2632; 
    name = "coda";
    transactionAssets = [
        new CodaAddJobAsset()
    ];

    actions = {
        getJobs: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } =  codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            return jobs.map(job => ({...job, bounty: job.bounty.toString()}));
        },
        getRandomJob: async ({ uid } : Record<string,unknown>) => {

            // retrieve all current jobs
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            if (jobs.length === 0) throw new Error("The jobs list is empty");

            // filter out all jobs that are already done by this user
            if (uid) {
                let j = 0;
                for (let i = 0; i < jobs.length; i++) {
                    const job = jobs[i];
                    const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + job.package);
                    if (trustFactsBuffer !== undefined) {
                        const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                        for (const fact of facts) if (fact.account.uid === uid) continue;
                    }
                    jobs[j++] = job;
                }

                if (jobs.length === 0) throw new Error("You've done all jobs in the list");
            }


            // get a random job, weighted by bounty
            const totalBounty = jobs.reduce((count, job) => count + job.bounty, BigInt(0));
            let rand = randomBigInt(totalBounty);
            let job! : CodaJob;
            for (job of jobs) {
                rand -= job.bounty;
                if (rand < 0) break;
            }

            // fetch this random job´s package data
            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:" + job.package) as Buffer;
            const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);

            return { ...job, bounty: job.bounty.toString(), ...packageData };
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
            
            return requiredBounty(totalBounty, networkCapacity, uniqueActiveSpiders).toString();
        },
        encodeCodaJob: async (asset: Record<string, unknown>) => {
            return codec.encode(minimalCodaJobSchema, asset).toString('hex');
        }
    }

    async afterGenesisBlockApply({ stateStore }) {
        const jobsBuffer = codec.encode(codaJobListSchema, { jobs: [] });
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        for (const pack of coda.jobs) {
            jobs.push(pack);
            
        }
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }
}
