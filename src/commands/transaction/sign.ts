/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { TransactionSignCommand } from 'klayr-commander';
import { Application, PartialApplicationConfig } from 'klayr-sdk';
import { getApplication } from '../../app/app';

type SignFlags = typeof TransactionSignCommand.flags & { [key: string]: Record<string, unknown> };

export class SignCommand extends TransactionSignCommand {
	static flags: SignFlags = {
		...TransactionSignCommand.flags,
	};

	static args = [...TransactionSignCommand.args];

	public getApplication(config: PartialApplicationConfig): Application {
		const app = getApplication(config);
		return app;
	}
}
