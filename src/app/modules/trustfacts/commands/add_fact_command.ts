/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { CodaMethod } from '../../coda/method';
import { AddTrustFact, AddTrustFactSchema, TrustFactsStore, trustFactsIndex } from '../stores/trustfacts'
import * as GPG from '../../../common/gpg-verification';
import { SignedSchema, Signed } from '../../../common/signed-schemas';
import { AccountsMethod } from '../../accounts/method';

type Params = Signed<AddTrustFact>;

export class AddFactCommand extends Modules.BaseCommand {
    private codaMethod!: CodaMethod;
    private accountsMethod!: AccountsMethod;
    
    public addDependecies(codaMethod: CodaMethod, accountsMethod: AccountsMethod) {
        this.codaMethod = codaMethod; 
		this.accountsMethod = accountsMethod;
    }

	public schema = SignedSchema(AddTrustFactSchema);

	public async verify(context: StateMachine.CommandVerifyContext<Params>): Promise<StateMachine.VerificationResult> {
        const { params } = context;
        if (params.data.factData.trim() === "") throw new Error("FactData cannot be empty");
        if (!params.signature) throw new Error("Signature is missing!");
		const keys = await this.accountsMethod.getKeys(context);
        await GPG.verify(params, AddTrustFactSchema, keys);
        const { jobs } = await this.codaMethod.getJobs(context);
        const job = jobs.find(j => j.jobID === params.data.jobID);
        if (job === undefined) {
            context.logger.error(jobs);
            throw new Error("Job with given job ID does not exist!");
        }
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(context: StateMachine.CommandExecuteContext<Params>): Promise<void> {
		const { params } = context;
		const keys = await this.accountsMethod.getKeys(context);
        const uid = await GPG.verify(params, AddTrustFactSchema, keys);
        const { jobs } = await this.codaMethod.getJobs(context);
        const job = jobs.find(j => j.jobID === params.data.jobID);
        // This was already verified above but needed to type check
        if (job === undefined) {
            return;
        }

        const factsStore = this.stores.get(TrustFactsStore);
        // TODO: also filter on owner and platform
        const {facts} = await factsStore.get(context, trustFactsIndex);

        // check if this account already has a fact for this job
        const existingFact = facts.find(fact => fact.account.uid === uid && fact.jobID === params.data.jobID);
        if (existingFact !== undefined) {
            context.logger.error("Account already has a fact for this job! Ignoring this new fact...");
            return;
        }

        facts.push({ 
            fact: job.fact, 
            factData: params.data.factData, 
            version: job.version, 
            jobID: params.data.jobID,
            account: { uid },
            packageName: job.package
        });

        await factsStore.set(context, trustFactsIndex, { facts });
	}
}
