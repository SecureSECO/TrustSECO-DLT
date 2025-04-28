import { BaseEndpoint, codec, ModuleEndpointContext } from 'lisk-sdk';
import { minimalCodaJobSchema, CodaJob, isMinimalCodaJob, validFacts, CodaJobListStore, jobListKey } from './stores/coda-schemas';
import { CodaMethod } from './method'

export class CodaEndpoint extends BaseEndpoint {
    private codaMethod!: CodaMethod;

    public addDependecies(method: CodaMethod){
        this.codaMethod = method;
    }

    public async encodeCodaJob(ctx: ModuleEndpointContext) {
        const params = ctx.params;
        if (!isMinimalCodaJob(params)){
            throw new Error('Argument must be minimal coda Job');
        }
        params.bounty = BigInt(params.bounty as string | number);
        return codec.encode(minimalCodaJobSchema, params).toString('hex');
    }
    public async getAllFacts() {
        return validFacts;
    }
    public async getJobs(ctx: ModuleEndpointContext) {
        const jobsStore = this.stores.get(CodaJobListStore);
        let jobs: CodaJob[] = [];
        if (await jobsStore.has(ctx, jobListKey)){
            jobs = (await jobsStore.get(ctx, jobListKey)).jobs;
        }
        return jobs.map(job => ({ ...job, bounty: job.bounty.toString() }));
    }
    public async getMinimumRequiredBounty(ctx: ModuleEndpointContext) {
        return (await this.codaMethod.requiredBounty(ctx)).toString();
    }
}
