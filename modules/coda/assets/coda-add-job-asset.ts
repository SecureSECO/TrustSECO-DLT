import { ApplyAssetContext, BaseAsset, codec, StateStore, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { requiredBounty } from '../../math';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { TrustFactList, TrustFactListSchema } from '../../trustfacts/trustfacts_schema';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob, codaJobIdSchema, validFacts } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    id = 26320;
    name = 'AddJob';
    schema = SignedSchema(minimalCodaJobSchema);
    header;
    
    validate({ asset, header }: ValidateAssetContext<Signed<MinimalCodaJob>>) {
        this.header = header;   
        asset = this.formatAsset({ asset });   
        if (asset.data.package === "") throw new Error("Package cannot be empty");
        if (asset.data.version === "") throw new Error("version cannot be empty");
        if (asset.data.fact === "") throw new Error("Fact cannot be empty");
        if (!Object.keys(validFacts).includes(asset.data.fact)) throw new Error("Fact is not valid");
        if (asset.data.bounty < 0) throw new Error("Bounty cannot be negative");

        // todo; verify signature (asset.signature)
        if (!asset.signature) throw new Error("Signature is missing!");
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<MinimalCodaJob>>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // calculate activeSpiders and networkCapacity
        let totalFacts = 0;
        const accounts: Set<string> = new Set();

        for (const job of jobs) {
            const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
            if (trustFactsBuffer != undefined) {
                const { facts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                totalFacts += facts.length;
                for (const fact of facts) {
                    accounts.add(fact.account.uid);
                }
            }
        }

        const activeSpiders = accounts.size;
        const networkCapacity = totalFacts;

        // check if bounty is higher than minimum required
        const totalBounty = jobs.reduce((acc, job) => acc + job.bounty, BigInt(0));
        const rB = requiredBounty(totalBounty, networkCapacity, activeSpiders);

        if (asset.data.bounty < rB) throw new Error("Bounty is too low!");

        /* todo; get uid from the following gpg signature: */ asset.signature;
        // and get its gpg uid:
        const accountUid = "test-account";
        
        // Deduct bounty from account
        const accountBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        if (accountBuffer == undefined) throw new Error("Account does not exist in");
        const account = codec.decode<Account>(AccountSchema, accountBuffer);
        account.slingers -= asset.data.bounty;
        if (account.slingers < 0) throw new Error("Bounty is higher than account credit!");
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));
        
        // Add job to list
        const job = await this.createCodaJob({ asset, stateStore, jobs, account: { uid: accountUid } });
        jobs.push(job);
        jobs = await this.removeOldJobs(jobs, stateStore);
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }

    async createCodaJob({ asset, stateStore, jobs, account }) {
        asset = this.formatAsset({ asset });
        this.checkIfJobAlreadyExists({ asset }, jobs);
        await this.checkIfPackageAndVersionExist({ asset, stateStore });

        const job: CodaJob = {
            package: asset.data.package,
            version: asset.data.version,
            fact: asset.data.fact,
            date: this.header.height.toString(),
            jobID: await this.generateJobId({ stateStore }),
            bounty: asset.data.bounty,
            account: account
        }
        const duplicateIdCheck = jobs.filter(oldJob => oldJob.jobID == job.jobID).length > 0;
        while (duplicateIdCheck) {
            job.jobID = await this.generateJobId({ stateStore });
        }
        return job;
    }

    checkIfJobAlreadyExists({ asset }, jobs) {
        if (jobs.filter(job => job.package == asset.data.package && 
            job.fact == asset.data.fact && job.version == asset.data.version).length > 0) {
            throw new Error("There already exists a job for the given package, version and fact!");
        }
    }

    async checkIfPackageAndVersionExist({ asset, stateStore }) {
        // Check if package is in packagedata and if version exists
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.data.package) as Buffer;
        if (packageDataBuffer === undefined) {
            throw new Error("The given package does not exist in the packageData!");
        }

        const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
        const versionFound = packageData.packageReleases.some(version => {
            return asset.data.version == version;
        }); 
        if (!versionFound) {
            throw new Error("The given package version does not exist in the packageData!");
        } 
    }

    async removeOldJobs(jobs: CodaJob[], stateStore: StateStore) {
        const jobsToKeep: CodaJob[] = [];
        for (const job of jobs) {
            const differenceInBlockHeight = this.header.height - parseInt(job.date);
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

        return jobsToKeep;
    }

    formatAsset({ asset }) {
        asset.data.package = asset.data.package.trim();
        asset.data.package = asset.data.package.toLowerCase();
        asset.data.version = asset.data.version.trim();
        asset.data.version = asset.data.version.replace(/[^\d.-]/g, '');
        asset.data.fact = asset.data.fact.trim();
        asset.data.fact = asset.data.fact.toLowerCase();
        return asset;
    }

    async generateJobId({ stateStore }) {
        const jobIdBuffer = await stateStore.chain.get("coda:jobId") as Buffer;
        const { jobId } = codec.decode(codaJobIdSchema, jobIdBuffer);

        if (jobId == Math.pow(2, 32)) {
            await stateStore.chain.set("coda:jobId", codec.encode(codaJobIdSchema, { jobId: 0 }));
        } else {
            await stateStore.chain.set("coda:jobId", codec.encode(codaJobIdSchema, { jobId: jobId + 1 }));
        }
        return jobId;
    }
}