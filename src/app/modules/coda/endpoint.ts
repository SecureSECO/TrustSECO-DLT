import { Modules, codec, Types } from 'klayr-sdk';
import { minimalCodaJobSchema, isMinimalCodaJob, validFacts, CodaJobListStore, jobListKey } from './stores/coda-schemas';
import { CodaMethod } from './method'

export class CodaEndpoint extends Modules.BaseEndpoint {
    private codaMethod!: CodaMethod;

    public addDependecies(method: CodaMethod){
        this.codaMethod = method;
    }

    public async encodeCodaJob(ctx: Types.ModuleEndpointContext) {
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
    public async getJobs(ctx: Types.ModuleEndpointContext) {
        const jobsStore = this.stores.get(CodaJobListStore);
        let jobs = (await jobsStore.get(ctx, jobListKey)).jobs;
        return jobs.map(job => ({ ...job, bounty: job.bounty.toString() }));
    }
    public async getMinimumRequiredBounty(ctx: Types.ModuleEndpointContext) {
        return (await this.codaMethod.requiredBounty(ctx)).toString();
    }
}
