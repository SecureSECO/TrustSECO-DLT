import { AccountAddCommand } from '../../../../../src/app/modules/accounts/commands/account_add_command';
import { AccountsModule } from '../../../../../src/app/modules/accounts/module';

describe('AccountAddCommand', () => {
	let command: AccountAddCommand;

	beforeEach(() => {
		const module = new AccountsModule();
		command = new AccountAddCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('accountAdd');
		});

		it('should have valid schema', () => {
			expect(command.schema).toMatchSnapshot();
		});
	});

	describe('verify', () => {
		describe('schema validation', () => {
			it.todo('should throw errors for invalid schema');
			it.todo('should be ok for valid schema');
		});
	});

	describe('execute', () => {
		describe('valid cases', () => {
			// TODO: this is hard to test because of url request
			it.todo('should update the state store');
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
