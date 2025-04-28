/* eslint-disable class-methods-use-this */

import {
    BaseCommand,
    CommandVerifyContext,
    CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { CodaMethod } from '../../coda/method';

interface Params {
}

export class AddFactCommand extends BaseCommand {
	// @ts-ignore: unused error
    private codaMethod!: CodaMethod;
    
    public addDependecies(codaMethod: CodaMethod) {
        this.codaMethod = codaMethod; 
    }

	public schema = {
		$id: 'AddFactCommand',
		type: 'object',
		properties: {},
	};

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<Params>): Promise<VerificationResult> {
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<Params>): Promise<void> {
	}
}
