import { AddJobCommand } from '../../../../../src/app/modules/coda/commands/add_job_command';
import { CodaModule } from '../../../../../src/app/modules/coda/module';

describe('AddJobCommand', () => {
	let command: AddJobCommand;

	beforeEach(() => {
		const mod = new CodaModule();
		command = new AddJobCommand(mod.stores, mod.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('addJob');
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
			it.todo('should update the state store');
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
