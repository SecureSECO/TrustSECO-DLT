import { ApplyAssetContext, BaseAsset, codec, StateStore, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { requiredBounty, requiredVerifications } from '../../math';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { StoreTrustFact, TrustFactList, TrustFactListSchema } from '../../trustfacts/trustfacts_schema';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob} from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    id = 26320;
    name = 'AddJob';
    schema = SignedSchema(minimalCodaJobSchema);

    validate({ asset }: ValidateAssetContext<Signed<MinimalCodaJob>>) {
        // asset = this.formatAsset({ asset });
        if (asset.data.package === "") throw new Error("Package cannot be empty");
        if (asset.data.version === "") throw new Error("version cannot be empty");
        if (asset.data.fact === "") throw new Error("Fact cannot be empty");
        if (asset.data.bounty < 0) throw new Error("Bounty cannot be negative");

        // todo; check signature (asset.signature)
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<MinimalCodaJob>>) {

        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        let { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // check if bounty is higher than minimum required
        const totalBounty = jobs.reduce((acc, job) => acc + job.bounty, BigInt(0));
        const activeSpiders = 2; // todo; number of unique spiders that have sent in facts recently
        const networkCapacity = 100; // todo; amount of facts sent in recently
        const rB = requiredBounty(totalBounty, networkCapacity, activeSpiders);

        if (asset.data.bounty < rB) throw new Error("Bounty is too low!");

        /* todo; get uid from the following gpg signature: */ asset.signature;
        // and get its gpg uid:
        const accountUid = "test-account";

        // Deduct bounty from account
        const accountBuffer = await stateStore.chain.get("account:" + accountUid) as Buffer;
        const account = codec.decode<Account>(AccountSchema, accountBuffer);
        account.slingers -= asset.data.bounty;
        if (account.slingers < 0) throw new Error("Bounty is higher than account credit!");
        await stateStore.chain.set("account:" + accountUid, codec.encode(AccountSchema, account));

        // Add job to list
        const job = await this.createCodaJob({ asset: asset.data, stateStore, jobs, account: { uid: accountUid } });
        jobs.push(job);
        jobs = await this.removeOldJobs(jobs, stateStore);
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }

    async createCodaJob({ asset, stateStore, jobs, account }) {
        asset = this.formatAsset({ asset });
        this.checkIfJobAlreadyExists({ asset }, jobs);
        await this.checkIfPackageAndVersionExist({ asset, stateStore });

        const job: CodaJob = {
            package: asset.package,
            version: asset.version,
            fact: asset.fact,
            date: new Date().toString(),
            jobID: this.generateRandomNumber(),
            bounty: asset.bounty,
            account: account
        }
        const duplicateIdCheck = jobs.filter(oldJob => oldJob.jobID == job.jobID).length > 0;
        while (duplicateIdCheck) {
            job.jobID = this.generateRandomNumber();
        }
        return job;
    }

    checkIfJobAlreadyExists({ asset }, jobs) {
        if (jobs.filter(job => job.package == asset.package && 
            job.fact == asset.fact && job.version == asset.version).length > 0) {
            throw new Error("There already exists a job for the given package, version and fact!");
        }
    }

    async checkIfPackageAndVersionExist({ asset, stateStore }) {
        // Check if package is in packagedata and if version exists
        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.package) as Buffer;
        if (packageDataBuffer === undefined) {
            throw new Error("The given package does not exist in the packageData!");
        }

        const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
        const versionFound = packageData.packageReleases.some(version => {
            return asset.version == version;
        }); 
        if (!versionFound) {
            throw new Error("The given package version does not exist in the packageData!");
        } 
    }

    async removeOldJobs(jobs: CodaJob[], stateStore: StateStore) {

        const jobsToKeep: CodaJob[] = [];
        for (const job of jobs) {
            const differenceInMilliSeconds = new Date().getTime() - new Date(job.date).getTime();
            const differenceInMinutes = Math.ceil(differenceInMilliSeconds / (1000 * 60));
            if (differenceInMinutes <= 10) jobsToKeep.push(job);
            
            else {
                // this job is too old; discard it, and payout all rewards!

                const trustFactsBuffer = await stateStore.chain.get("trustfacts:" + job.package);
                if (trustFactsBuffer !== undefined) {
                    const { facts: allFacts } = codec.decode<TrustFactList>(TrustFactListSchema, trustFactsBuffer);
                    const facts = allFacts.filter(fact => fact.jobID == job.jobID);

                    const reward = job.bounty / BigInt(facts.length); // todo; increase reward when there is a surplus of network capacity??

                    for (const fact of facts) {
                        fact.account.uid
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
        asset.package = asset.package.trim();
        asset.package = asset.package.toLowerCase();
        asset.version = asset.version.trim();
        asset.version = asset.version.replace(/[^\d.-]/g, '');
        asset.fact = asset.fact.trim();
        asset.fact = asset.fact.toLowerCase();
        return asset;
    }

    generateRandomNumber() {
        return Math.floor(Math.random() * (Math.pow(2, 32)));
    }
}