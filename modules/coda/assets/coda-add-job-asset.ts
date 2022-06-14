import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { CodaModule } from '../coda-module';
import { spawnSync } from 'child_process';
import { unlink, writeFileSync } from 'fs';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob, codaJobIdSchema, validFacts, codaBlockHeightSchema } from '../coda-schemas';

export class CodaAddJobAsset extends BaseAsset {
    id = 26320;
    name = 'AddJob';
    schema = SignedSchema(minimalCodaJobSchema);
    
    validate({ asset }: ValidateAssetContext<Signed<MinimalCodaJob>>) {
        asset = this.formatAsset({ asset });
        if (asset.data.package === "") throw new Error("Package cannot be empty");
        if (asset.data.version === "") throw new Error("version cannot be empty");
        if (asset.data.fact === "") throw new Error("Fact cannot be empty");
        if (!validFacts.flatMap(a => a.facts).includes(asset.data.fact)) throw new Error("Fact is not valid");
        if (asset.data.bounty < 0) throw new Error("Bounty cannot be negative");

        // todo; verify signature (asset.signature)
        if (!asset.signature) throw new Error("Signature is missing!");

        //---start of gpg verification---
        // generate random number that identifies this gpg verification
        const random = Math.random().toString().slice(2);
        // write asset.signature to file
        writeFileSync("/tmp/signature-" + random, asset.signature);
        const encoded = codec.encode(minimalCodaJobSchema, asset.data).toString('hex');
        // write data to fle
        writeFileSync("/tmp/data-" + random, encoded);

        // verify signature        
        const result = spawnSync(`gpg`, ["--verify", "/tmp/signature-" + random, "/tmp/data-" + random]);

        // delete the files
        unlink("/tmp/signature-" + random, () => 0);
        unlink("/tmp/data-" + random, () => 0);

        // extract the key
        const regex = /key \w*(\w{16})/;        
        const accountUid = regex.exec(result.stderr?.toString())?.[1];

        // if there is no key, the verification failed
        if (result.status != 2 || accountUid == null) {throw new Error("gpg verification failed");}
        //---end of gpg verification---
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<MinimalCodaJob>>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // check if bounty is higher than minimum required
        const rB = await CodaModule.requiredBounty( key => stateStore.chain.get(key) );
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

        // delete the files
        unlink("/tmp/signature-" + random, () => 0);
        unlink("/tmp/data-" + random, () => 0);

        // extract the key
        const regex = /key \w*(\w{16})/;        
        const accountUid = regex.exec(result.stderr?.toString())?.[1];

        // if there is no key, the verification failed
        if (result.status != 2 || accountUid == null) throw new Error("gpg verification failed");
        //---end of gpg verification---

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
            date: (await this.getBlockHeight({ stateStore })).toString(),
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

    async getBlockHeight({ stateStore }) {
        const blockHeightBuffer = await stateStore.chain.get("coda:blockHeight") as Buffer;
        const { blockHeight } = codec.decode(codaBlockHeightSchema, blockHeightBuffer);
        return blockHeight;
    }
}