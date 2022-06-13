import { ApplyAssetContext, BaseAsset, codec, StateStore, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { requiredBounty } from '../../math';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { TrustFactList, TrustFactListSchema } from '../../trustfacts/trustfacts_schema';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob} from '../coda-schemas';
import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';

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

        //---start of gpg verification---
        // generate random number that identifies this gpg verification
        const random = Math.random().toString().slice(2);
        // write asset.signature to file
        writeFileSync("/tmp/signature-" + random, asset.signature);
        const encoded = codec.encode(minimalCodaJobSchema, asset.data);
        // write data to fle
        writeFileSync("/tmp/data-" + random, encoded);

        // verify signature        
        const result = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);

        // extract the key
        const regex = /key (\w*)/;        
        const accountUid = regex.exec(result.stderr?.toString())?.[1];

        // if there is no key, the verification failed
        if (accountUid == null) {throw new Error("gpg verification failed");}
        //---end of gpg verification---
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

        //---start of gpg verification (for accountUid extraction)---
        // generate random number that identifies this gpg verification
        const random = Math.random().toString().slice(2);
        // write asset.signature to file
        writeFileSync("/tmp/signature-" + random, asset.signature);
        const encoded = codec.encode(minimalCodaJobSchema, asset.data);
        // write data to fle
        writeFileSync("/tmp/data-" + random, encoded);

        // verify signature        
        const result = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);

        // extract the key
        const regex = /key (\w*)/;        
        const accountUid = regex.exec(result.stderr?.toString())?.[1];

        // if there is no key, the verification failed
        if (accountUid == null) {throw new Error("accountUid (for gpg verification) is null");} // redundant?
        //---end of gpg verification---

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