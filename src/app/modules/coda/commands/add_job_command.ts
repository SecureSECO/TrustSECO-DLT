/* eslint-disable class-methods-use-this */

import {
    BaseCommand,
    CommandVerifyContext,
    CommandExecuteContext,
    VerificationResult,
    VerifyStatus,
} from 'lisk-sdk';

import {
    minimalCodaJobSchema,
    MinimalCodaJob,
    validFacts,
    CodaJobListStore,
    jobListKey,
    CodaJobIdStore,
    jobIdKey
} from '../stores/coda-schemas';
import { GPG } from '../../../common/gpg-verification';
import { SignedSchema, Signed } from '../../../common/signed-schemas';
import { AccountsMethod } from '../../accounts/method';
import { CodaMethod } from '../method'
import { PackageDataMethod } from '../../package_data/method';
import { TrustfactsMethod } from '../../trustfacts/method';
import { StoreTrustFact } from '../../trustfacts/stores/trustfacts';

type Params = Signed<MinimalCodaJob>;

export class AddJobCommand extends BaseCommand {
    private accountsMethod!: AccountsMethod;
    private codaMethod!: CodaMethod;
    private packageDataMethod!: PackageDataMethod;
    private trustfactsMethod!: TrustfactsMethod;
    
    public addDependecies(accountsMethod: AccountsMethod, codaMethod: CodaMethod, packageDataMethod: PackageDataMethod, trustfactsMethod: TrustfactsMethod) {
        this.accountsMethod = accountsMethod;
        this.codaMethod = codaMethod; 
        this.packageDataMethod = packageDataMethod;
        this.trustfactsMethod = trustfactsMethod;
    }
    
    public schema = SignedSchema(minimalCodaJobSchema);
    
    public async verify({ params }: CommandVerifyContext<Params>): Promise<VerificationResult> {
        if (params.data.package.trim() !== params.data.package)
            throw new Error('Package name cannot start or end with whitespace!');
        if (params.data.package.toLowerCase() !== params.data.package)
            throw new Error('Package name must be lowercase!');
        if (params.data.version.trim() !== params.data.version)
            throw new Error('Version cannot start or end with whitespace!');
        if (!/^[^~^:"?[*@{]+$/.test(params.data.version))
            throw new Error('Version must be a valid git tag');
        if (params.data.fact.trim() !== params.data.fact)
            throw new Error('Fact cannot start or end with whitespace!');
        if (params.data.fact.toLowerCase() !== params.data.fact)
            throw new Error('Fact must be lowercase!');
        if (params.data.bounty < 0) throw new Error('Bounty cannot be negative!');
        if (params.data.package === '') throw new Error('Package cannot be empty');
        if (params.data.version === '') throw new Error('version cannot be empty');
        if (!validFacts.flatMap(a => a.facts).includes(params.data.fact))
            throw new Error('Invalid fact provided');
        if (!params.data.signature) throw new Error('Signature is missing!');
        return { status: VerifyStatus.OK };
    }
    
    public async execute(context: CommandExecuteContext<Params>): Promise<void> {
        const params = context.params;
        const keys: string[] = (await this.accountsMethod.getKeys(context));
        // Throws error on invalid signature
        const uid = await GPG.verify(params, minimalCodaJobSchema, keys);
    
        const jobsStore = this.stores.get(CodaJobListStore);
        const { jobs } = await jobsStore.get(context, jobListKey);
        // TODO: also filter on version, owner, and platform
        let facts: StoreTrustFact[] = await this.trustfactsMethod.getTrustFacts(context, { packageName: params.data.package });
    
        // check if bounty is higher than minimum required
        const rB = await this.codaMethod.requiredBounty(context);
        if (params.data.bounty < rB) {
            if (process.env.ACCEPT_INSUFFICIENT_BOUNTY)
                console.error(
                    'Bounty is lower than minimum required bounty! ACCEPT_INSUFFICIENT_BOUNTY is set, so continuing anyway.',
                );
            else throw new Error('Bounty is lower than minimum required bounty!');
        }
    
        // check if job already exists
        for (const job of jobs) {
            if (
                job.package === params.data.package &&
                job.fact === params.data.fact &&
                job.version === params.data.version
            ) {
                console.error('There already exists a job for the given package, version and fact!');
                return;
            }
        }
    
        // check if there already exists a fact for this job
        for (const fact of facts) {
            if (fact.fact === params.data.fact && fact.version === params.data.version) { // TODO: check name, owner and maybe platform
                console.error('There already exists a fact for the given package, version and fact!');
                return;
            }
        }
    
        // TODO should also filter on owner and platform
        const packageData = await this.packageDataMethod.getPackageInfo(context, { packageName: params.data.package });
        const versionFound = packageData.packageReleases.some(
            version => params.data.version == version,
        );
        if (!versionFound)
            throw new Error('The given package version does not exist in the packageData!');
    
        const account = await this.accountsMethod.getAccount(context, uid)
        account.slingers -= params.data.bounty;
        if (account.slingers < 0) {
            throw new Error('Bounty is higher than account credit!');
        }
    
        const jobIdStore = this.stores.get(CodaJobIdStore);
        const { jobId } = (await jobIdStore.get(context, jobIdKey));
        const nextJobId = jobId + 1;
    
        const blockHeight = context.header.height;
    
        // Add job to list
        jobs.push({ ...params.data, account: { uid }, date: blockHeight.toString(), jobID: nextJobId });
    
        // apply!
        await this.accountsMethod.changeBalance(context, uid, -params.data.bounty);
        await jobsStore.set(context, jobListKey, {jobs});
        await jobIdStore.set(context, jobIdKey, {jobId: nextJobId});
    }
}
