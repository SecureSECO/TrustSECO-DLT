import { BaseModule, BeforeBlockApplyContext, codec } from 'lisk-sdk';
import { codaBlockHeightSchema, CodaJob, codaJobIdSchema, CodaJobList, codaJobListSchema, minimalCodaJobSchema } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';
import { requiredBounty } from '../math';
import { TrustFactList, TrustFactListSchema } from '../trustfacts/trustfacts_schema';
import { Account, AccountSchema } from '../accounts/accounts-schemas';

export class CodaModule extends BaseModule {
    id = 2632; 
    name = "coda";
    transactionAssets = [
        new CodaAddJobAsset()
    ];

    actions = {
        getJobs: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            const jobsFixed = jobs.map(job => ({...job, bounty: job.bounty.toString() }));
            return jobsFixed;
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
        const jobId = codec.encode(codaJobIdSchema, { jobId: 0 });
        const blockHeight = codec.encode(codaJobIdSchema, { blockHeight: 0 });
        await stateStore.chain.set("coda:jobs", jobsBuffer);
        await stateStore.chain.set("coda:jobId", jobId);
        await stateStore.chain.set("coda:blockHeight", blockHeight);
    }

    async beforeBlockApply({ stateStore, block } : BeforeBlockApplyContext) {
        await stateStore.chain.set("coda:blockHeight", codec.encode(codaBlockHeightSchema, { blockHeight: block.header.height }));

        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        const jobsToKeep: CodaJob[] = [];

        for (const job of jobs) {
            const differenceInBlockHeight = block.header.height - parseInt(job.date);
            if (differenceInBlockHeight <= 500) { 
                jobsToKeep.push(job); 
            }
            else {
                // this job is too old; discard it, and payout all rewards!
                const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
                if (trustFactsBuffer !== undefined) {
                    const { facts: allFacts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                    const facts = allFacts.filter(fact => fact.jobID == job.jobID);

                    const reward = job.bounty / BigInt(facts.length); // todo; increase reward when there is a surplus of network capacity??

                    for (const fact of facts) {
                        const accountBuffer = await stateStore.chain.get("account:" + fact.account.uid) as Buffer;
                        const account = codec.decode<Account>(AccountSchema, accountBuffer);
                        account.slingers += reward;
                        await stateStore.chain.set("account:" + fact.account.uid, codec.encode(AccountSchema, account));
                    }
                }
            }
        }
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobsToKeep }));
    }
}
