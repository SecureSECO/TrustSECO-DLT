import { ApplyAssetContext, BaseAsset, codec, ValidateAssetContext } from 'lisk-sdk';
import { Account, AccountSchema } from '../../accounts/accounts-schemas';
import { PackageDataSchema, PackageData } from '../../packagedata/packagedata-schemas';
import { Signed, SignedSchema } from '../../signed-schemas';
import { CodaModule } from '../coda-module';
import { CodaJobList, minimalCodaJobSchema, codaJobListSchema, MinimalCodaJob, codaJobIdSchema, validFacts, codaBlockHeightSchema } from '../coda-schemas';
import { GPG } from '../../../common/gpg-verification';

export class CodaAddJobAsset extends BaseAsset {
    id = 26320;
    name = 'AddJob';
    schema = SignedSchema(minimalCodaJobSchema);
    
    validate({ asset }: ValidateAssetContext<Signed<MinimalCodaJob>>) {
        if (asset.data.package.trim() !== asset.data.package) throw new Error("Package name cannot start or end with whitespace!");
        if (asset.data.package.toLowerCase() !== asset.data.package) throw new Error("Package name must be lowercase!");
        if (asset.data.version.trim() !== asset.data.version) throw new Error("Version cannot start or end with whitespace!");
        if (asset.data.version.replace(/[^\d.-]/g, '') !== asset.data.version) throw new Error("Version must only contain numbers, dots and dashes!");
        if (asset.data.fact.trim() !== asset.data.fact) throw new Error("Fact cannot start or end with whitespace!");
        if (asset.data.fact.toLowerCase() !== asset.data.fact) throw new Error("Fact must be lowercase!");
        if (asset.data.bounty < 0) throw new Error("Bounty cannot be negative!");

        if (asset.data.package === "") throw new Error("Package cannot be empty");
        if (asset.data.version === "") throw new Error("version cannot be empty");
        if (!validFacts.flatMap(a => a.facts).includes(asset.data.fact)) throw new Error("Invalid fact provided");
        if (!asset.signature) throw new Error("Signature is missing!");
        
        // will throw an error when the signature is invalid
        GPG.verify(asset, minimalCodaJobSchema);
    }

    async apply({ asset, stateStore }: ApplyAssetContext<Signed<MinimalCodaJob>>) {
        const jobsBuffer = await stateStore.chain.get("coda:jobs") as Buffer;
        const { jobs } = codec.decode<CodaJobList>(codaJobListSchema, jobsBuffer);



        // check if bounty is higher than minimum required

        const rB = await CodaModule.requiredBounty( key => stateStore.chain.get(key) );
        if (asset.data.bounty < rB) {
            if (process.env.ACCEPT_INSUFFICIENT_BOUNTY)
                console.error("Bounty is lower than minimum required bounty! ACCEPT_INSUFFICIENT_BOUNTY is set, so continuing anyway.");
            else throw new Error("Bounty is lower than minimum required bounty!");
        }



        // check if job already exists

        for (const job of jobs) {
            if (job.package == asset.data.package &&
                job.fact == asset.data.fact &&
                job.version == asset.data.version) {
                console.error("There already exists a job for the given package, version and fact!");
                return;
            }
        }



        // check if package & version exists

        const packageDataBuffer = await stateStore.chain.get("packagedata:" + asset.data.package);
        if (packageDataBuffer === undefined) {
            throw new Error("The given package does not exist in the packageData!");
        }

        const packageData = codec.decode<PackageData>(PackageDataSchema, packageDataBuffer);
        const versionFound = packageData.packageReleases.some(version => asset.data.version == version);
        if (!versionFound) throw new Error("The given package version does not exist in the packageData!");



        // Deduct bounty from account
        const uid = GPG.verify(asset, minimalCodaJobSchema);
        let accountBuffer = await stateStore.chain.get("account:" + uid);
        if (accountBuffer == undefined) {
            if (process.env.ACCEPT_INVALID_ACCOUNT) {
                console.error("Account does not exist! ACCEPT_INVALID_ACCOUNT is set, so creating a new throwaway account.");
                const account: Account = { slingers: BigInt(5000) };
                accountBuffer = codec.encode(AccountSchema, account);
            }
            else throw new Error("Account does not exist");
        }
        const account = codec.decode<Account>(AccountSchema, accountBuffer);
        account.slingers -= asset.data.bounty;
        if (account.slingers < 0) {
            if (process.env.ACCEPT_INSUFFICIENT_BOUNTY)
                console.error("Bounty is higher than account credit! ACCEPT_INSUFFICIENT_BOUNTY is set, so continuing anyway.");
            else throw new Error("Bounty is higher than account credit!");
        }



        // calculate next jobId (by adding 1, wow)

        const jobIdBuffer = await stateStore.chain.get("coda:jobId") as Buffer;
        const { jobId: predJobID } = codec.decode<{ jobId: number }>(codaJobIdSchema, jobIdBuffer);
        const jobID = (predJobID + 1) % 2 ** 32;



        const blockHeightBuffer = await stateStore.chain.get("coda:blockHeight") as Buffer;
        const { blockHeight } = codec.decode<{ blockHeight: number }>(codaBlockHeightSchema, blockHeightBuffer);


        // Add job to list

        jobs.push({ ...asset.data, account: { uid }, date: blockHeight.toString(), jobID });

        // apply!
        await stateStore.chain.set("account:" + uid, codec.encode(AccountSchema, account));
        await stateStore.chain.set("coda:jobs", codec.encode(codaJobListSchema, { jobs }));
    }
}