import { Modules, StateMachine } from 'klayr-sdk';
import { CodaJobListStore, jobListKey, CodaJob, CodaJobList } from './stores/coda-schemas'
import { TrustfactsMethod } from '../trustfacts/method';

export class CodaMethod extends Modules.BaseMethod {
    private trustfactsMethod!: TrustfactsMethod;
    
    public addDependecies(trustfactsMethod: TrustfactsMethod) {
        this.trustfactsMethod = trustfactsMethod;
    }

    public async getJobs(ctx: StateMachine.ImmutableMethodContext): Promise<CodaJobList> {
        const codaStore = this.stores.get(CodaJobListStore);
        return codaStore.get(ctx, jobListKey);
    }

	public async requiredBounty(ctx: StateMachine.ImmutableMethodContext): Promise<bigint> {
        const jobsStore = this.stores.get(CodaJobListStore);
        let jobs: CodaJob[] = [];
        if (await jobsStore.has(ctx, jobListKey)){
            jobs = (await jobsStore.get(ctx, jobListKey)).jobs;
        }
        
        let totalFacts = 0;
        let totalBounty = BigInt(0);
        const spideringAccounts: Set<string> = new Set();

        for (const job of jobs) {
            totalBounty += job.bounty;

            const facts = await this.trustfactsMethod.getTrustFacts(ctx, { packageName: job.package });
            totalFacts += facts.length;
            for (const fact of facts) {
                spideringAccounts.add(fact.account.uid);
            }
        }

        const uniqueActiveSpiders = spideringAccounts.size;
        const networkCapacity = totalFacts;

        return requiredBounty(totalBounty, networkCapacity, uniqueActiveSpiders);
	}
}

/* eslint-disable no-bitwise */
export function requiredVerifications(activeSpiders: number): number {
    const gamma = 0.5772156649015328;                   // Euler–Mascheroni constant
    const f = (c: number) => c * (Math.log(c) + gamma); // Harmonic Series approximation

    let c = 1; while (c < activeSpiders) c <<= 1;
    let e = c >> 1;

    while (e > 0) {
        if (f(c) <= activeSpiders) c += e;
        else c -= e;
        e >>= 1;
    }

    return c;
}

export function requiredBounty(totalBounty: bigint, networkCapacity: number, activeSpiders: number) {
    if (networkCapacity <= 0 || activeSpiders <= 0) return BigInt(1000);
    const rV = BigInt(requiredVerifications(activeSpiders));
    const cap = BigInt(networkCapacity + 2);
    return BigInt(1000) + totalBounty * rV / (cap - rV);
}
