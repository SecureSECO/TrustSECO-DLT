/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, ModuleMetadata, GenesisBlockExecuteContext, BlockAfterExecuteContext } from 'lisk-sdk';
import { AddJobCommand } from './commands/add_job_command';
import { CodaEndpoint } from './endpoint';
import { CodaMethod } from './method';
import { CodaJobListStore, minimalCodaJobSchema, CodaJobIdStore, jobIdKey, jobListKey, CodaJob } from './stores/coda-schemas';
import { AccountsMethod } from '../accounts/method';
import { PackageDataMethod } from '../package_data/method';
import { TrustfactsMethod } from '../trustfacts/method';
import { requiredVerifications } from './method';

export class CodaModule extends BaseModule {
	public endpoint = new CodaEndpoint(this.stores, this.offchainStores);
	public method = new CodaMethod(this.stores, this.events);
	public commands = [new AddJobCommand(this.stores, this.events)];
    private trustfactsMethod!: TrustfactsMethod;
    private accountsMethod!: AccountsMethod;

	public constructor() {
		super();
		// registeration of stores and events
		this.stores.register(CodaJobListStore, new CodaJobListStore(this.name, 0));
		this.stores.register(CodaJobIdStore, new CodaJobIdStore(this.name, 1));
	}

	public metadata(): ModuleMetadata {
		return {
			endpoints: [
				{
					name: this.endpoint.encodeCodaJob.name,
					request: minimalCodaJobSchema,
				},
				{
					name: this.endpoint.getAllFacts.name,
				},
				{
					name: this.endpoint.getJobs.name,
				},
				{
					name: this.endpoint.getMinimumRequiredBounty.name,
				}
			],
			commands: this.commands.map(command => ({
				name: command.name,
				params: command.schema,
			})),
			events: this.events.values().map(v => ({
				name: v.name,
				data: v.schema,
			})),
			assets: [],
			stores: [],
		};
	}

    public addDependecies(accountsMethod: AccountsMethod, packageDataMethod: PackageDataMethod, trustfactsMethod: TrustfactsMethod) {
		this.trustfactsMethod = trustfactsMethod;
		this.accountsMethod = accountsMethod;
		this.method.addDependecies(trustfactsMethod);
		this.endpoint.addDependecies(this.method);
		this.commands[0].addDependecies(accountsMethod, this.method, packageDataMethod, trustfactsMethod);
    }

	public async initGenesisState(context: GenesisBlockExecuteContext): Promise<void> {
		const jobIdStore = this.stores.get(CodaJobIdStore);
		jobIdStore.set(context, jobIdKey, { jobId: 0 })

		const jobsStore = this.stores.get(CodaJobListStore);
		jobsStore.set(context, jobListKey, {jobs: []})
	}

	// Executed every block after all transactions are completed
	public async afterTransactionsExecute(context: BlockAfterExecuteContext): Promise<void> {
		const jobsStore = this.stores.get(CodaJobListStore);
        const { jobs } = await jobsStore.get(context, jobListKey);
        const jobsToKeep: CodaJob[] = [];

        for (const job of jobs) {
            const differenceInBlockHeight = context.header.height - parseInt(job.date);
            if (differenceInBlockHeight <= 5760) { 
                jobsToKeep.push(job); 
				continue;
            }
			// this job is too old; discard it, and payout all rewards!
			// TODO: also filter on owner and platform
			const trustFacts = await this.trustfactsMethod.getTrustFacts(context, {packageName: job.package, packageRelease: job.version });
			const facts = trustFacts.filter(fact => fact.jobID === job.jobID);

			// if no facts were gathered nothing needs to be payed out, so we can continue
			if (facts.length === 0)
			{
				// TODO: this was acting weird so I set the above block difference higher to not trow away to much jobs
				// Keep the job if it younger than two weeks
				if (differenceInBlockHeight < 5760)
				{
					jobsToKeep.push(job);
				}
				context.logger.info(`Removing job ${job.jobID} (no facts) ${differenceInBlockHeight}`);
				continue;
			}
			context.logger.info(`Removing job ${job.jobID}`);

			const reward = await this.calculateReward(context, job, facts.length);

			for (const fact of facts) {
				await this.accountsMethod.changeBalance(context, fact.account.uid, reward)
			}
        }

        await jobsStore.set(context, jobListKey, {jobs: jobsToKeep});
	}

	// TODO: this reward payout calculation is pretty stupid, it is not even equal to the original bounty of the job
	// the reward also doesn't change if it was spidered by multiple accounts
	private async calculateReward(context: BlockAfterExecuteContext, job: CodaJob, jobFacts: number): Promise<bigint>{
		// calculate network capacity (total facts)
		const jobsStore = this.stores.get(CodaJobListStore);
        const { jobs } = await jobsStore.get(context, jobListKey);

		let totalFacts = 0;
		const spideringAccounts: Set<string> = new Set();

		for (const job of jobs) {
			// TODO: also filter on owner and platform
			const facts = await this.trustfactsMethod.getTrustFacts(context, {packageName: job.package, packageRelease: job.version });
			totalFacts += facts.length;
			for (const fact of facts) {
				spideringAccounts.add(fact.account.uid);
			}
		}

		const networkCapacity = totalFacts;
		const networkDemand = requiredVerifications(spideringAccounts.size) * jobs.length;

		// reward is increased or decreased proportionally to the network capacity-demand ratio
		return (BigInt(networkCapacity) * job.bounty) / (BigInt(jobFacts * networkDemand));
	}
}
