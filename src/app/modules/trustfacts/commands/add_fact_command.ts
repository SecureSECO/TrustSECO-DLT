/* eslint-disable class-methods-use-this */

import {
    BaseCommand,
    CommandVerifyContext,
    CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { CodaMethod } from '../../coda/method';
import { AddTrustFact, AddTrustFactSchema, TrustFactsStore, trustFactsIndex, StoreTrustFact } from '../stores/trustfacts'
import { GPG } from '../../../common/gpg-verification';
import { SignedSchema, Signed } from '../../../common/signed-schemas';
import { AccountsMethod } from '../../accounts/method';
import { TrustfactsMethod } from '../method';

type Params = Signed<AddTrustFact>;

export class AddFactCommand extends BaseCommand {
    private codaMethod!: CodaMethod;
    private accountsMethod!: AccountsMethod;
    private trustfactsMethod!: TrustfactsMethod;
    
    public addDependecies(codaMethod: CodaMethod, accountsMethod: AccountsMethod, trustfactsMethod: TrustfactsMethod) {
        this.codaMethod = codaMethod; 
		this.accountsMethod = accountsMethod;
        this.trustfactsMethod = trustfactsMethod;
    }

	public schema = SignedSchema(AddTrustFactSchema);

	public async verify({params}: CommandVerifyContext<Params>): Promise<VerificationResult> {
        if (params.data.factData.trim() === "") throw new Error("FactData cannot be empty");
        if (!params.signature) throw new Error("Signature is missing!");
		return { status: VerifyStatus.OK };
	}

	public async execute(context: CommandExecuteContext<Params>): Promise<void> {
		const { params } = context;
		const keys = await this.accountsMethod.getKeys(context);
        // Throws error on invalid signature
        const uid = await GPG.verify(params, AddTrustFactSchema, keys);
        const { jobs } = await this.codaMethod.getJobs(context);
        const job = jobs.find(job => job.jobID === params.data.jobID);

        if (job === undefined) {
            context.logger.error(jobs);
            throw new Error("Job with given job ID does not exist!");
        }

        // TODO: also filter on owner and platform
        let facts: StoreTrustFact[] = await this.trustfactsMethod.getTrustFacts(context, {packageName: job.package, packageRelease: job.version});

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

        const factsStore = this.stores.get(TrustFactsStore);
        await factsStore.set(context, trustFactsIndex, { facts });
	}
}
