import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { CodaModule } from '../coda-module';
import { CodaJob, CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob, codaJobIdSchema, validFacts, codaBlockHeightSchema } from '../coda-schemas';
import { GPG } from '../../../common/gpg-verification';

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
        if (!asset.signature) throw new Error("Signature is missing!");
        
        // will throw an error when the signature is invalid
        GPG.verify(asset, minimalCodaJobSchema);
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<MinimalCodaJob>>) {
        const uid = GPG.verify(asset, minimalCodaJobSchema);

        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);

        // check if bounty is higher than minimum required
        const rB = await CodaModule.requiredBounty( key => stateStore.chain.get(key) );
        if (asset.data.bounty < rB) throw new Error("Bounty is too low!");

        // Deduct bounty from account
        const accountBuffer = await stateStore.chain.get("account:" + uid) as Buffer;
        if (accountBuffer == undefined) throw new Error("Account does not exist");
        const account = codec.decode<Account>(AccountSchema, accountBuffer);
        account.slingers -= asset.data.bounty;
        if (account.slingers < 0) throw new Error("Bounty is higher than account credit!");
        await stateStore.chain.set("account:" + uid, codec.encode(AccountSchema, account));
        
        // Add job to list
        const job = await this.createCodaJob({ asset, stateStore, jobs, account: { uid } });
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