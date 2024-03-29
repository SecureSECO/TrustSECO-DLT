import { AfterGenesisBlockApplyContext, BaseModule, BeforeBlockApplyContext, codec } from 'lisk-sdk';
import { codaBlockHeightSchema, CodaJob, codaJobIdSchema, CodaJobList, codaJobListSchema, minimalCodaJobSchema, validFacts } from './coda-schemas';
import { CodaAddJobAsset } from './assets/coda-add-job-asset';
import { PackageData, PackageDataSchema } from '../packagedata/packagedata-schemas';
import { randomBigInt, requiredBounty, requiredVerifications } from '../math';
import { TrustFactList, TrustFactListSchema } from '../trustfacts/trustfacts_schema';
import { Account, AccountId, AccountSchema } from '../accounts/accounts-schemas';

export class CodaModule extends BaseModule {
    id = 2632; 
    name = "coda";
    transactionAssets = [
        new CodaAddJobAsset()
    ];
    actions = {
        encodeCodaJob: async function(asset: Record<string, unknown>) {
            asset.bounty = BigInt(asset.bounty as string | number);
            return codec.encode(minimalCodaJobSchema, asset).toString('hex');
        },
        getAllFacts: async () => {
            return validFacts;
        },
        getJobs: async () => {
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            const { jobs } =  codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
            return jobs.map(job => ({...job, bounty: job.bounty.toString()}));
        },
        getRandomJob: async (record : Record<string,unknown>) => {
            const { uid } = record as AccountId;
            if (!uid) throw new Error("uid is required");
            const jobsBuffer = await this._dataAccess.getChainState("coda:jobs") as Buffer;
            let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

            const jobIsDone = await Promise.all(jobs.map(async job => {
                const trustFactsBuffer = await this._dataAccess.getChainState("trustfacts:" + job.package);
                if (trustFactsBuffer === undefined) return false;
                const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                return facts.some(fact => fact.jobID === job.jobID && fact.account.uid === uid);
            }));

            for (let i = 0; i < jobs.length; i++) console.log(`Job ${jobs[i].jobID} done? ${jobIsDone[i]}`);

            jobs = jobs.filter((_, i) => !jobIsDone[i]);

            if (jobs.length === 0) throw new Error("You've done all jobs in the list");

            // get a random job, weighted by bounty
            const totalBounty = jobs.reduce((count, job) => count + job.bounty, BigInt(0));
            let rand = randomBigInt(totalBounty);
            let job! : CodaJob;
            for (job of jobs) {
                rand -= job.bounty;
                if (rand < 0) break;
            }

            // fetch this random job´s package data
            const packageDataBuffer = await this._dataAccess.getChainState("packagedata:" + job.package);
            if (packageDataBuffer === undefined) throw new Error("This should never happen. Found a job for a package that doesn't exist");
            const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);

            return { ...job, bounty: job.bounty.toString(), ...packageData };
        },
        getMinimumRequiredBounty: async () =>
            (await CodaModule.requiredBounty( key => this._dataAccess.getChainState(key) )).toString()
    }

    async afterGenesisBlockApply({ stateStore } : AfterGenesisBlockApplyContext) {
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

                    // calculate network capacity (total facts)
                    const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
                    const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
                    
                    let totalFacts = 0;
                    const spideringAccounts: Set<string> = new Set();

                    for (const job of jobs) {
                        const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
                        if (trustFactsBuffer !== undefined) {
                            const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                            totalFacts += facts.length;
                            for (const fact of facts) {
                                spideringAccounts.add(fact.account.uid);
                            }
                        }
                    }

                    const networkCapacity = totalFacts;
                    const networkDemand = requiredVerifications(spideringAccounts.size) * jobs.length;

                    // reward is increased or decreased proportionally to the network capacity-demand ratio
                    const reward = (BigInt(networkCapacity) * job.bounty) / (BigInt(facts.length * networkDemand));

                    for (const fact of facts) {
                        const accountBuffer = await stateStore.chain.get("account:" + fact.account.uid);
                        if (accountBuffer === undefined) throw new Error("This should never happen. Found a fact for an account that doesn't exist");
                        const account = codec.decode<Account>(AccountSchema, accountBuffer);
                        account.slingers += reward;
                        await stateStore.chain.set("account:" + fact.account.uid, codec.encode(AccountSchema, account));
                    }
                }
            }
        }
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs : jobsToKeep }));
    }

    static async requiredBounty( getChainState: (key: string) => Promise<Buffer | undefined> ) {
        const jobsBuffer = await getChainState("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);
        
        let totalFacts = 0;
        let totalBounty = BigInt(0);
        const spideringAccounts: Set<string> = new Set();

        for (const job of jobs) {
            totalBounty += job.bounty;
            const trustFactsBuffer = await getChainState("trustfacts:" + job.package);
            if (trustFactsBuffer !== undefined) {
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
    }
}