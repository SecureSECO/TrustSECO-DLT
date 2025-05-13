import { AddFactCommand } from '../../../../../src/app/modules/trustfacts/commands/add_fact_command';
import { TrustfactsModule } from '../../../../../src/app/modules/trustfacts/module';

describe('AddFactCommand', () => {
  let command: AddFactCommand;

	beforeEach(() => {
		const mod = new TrustfactsModule();
		command = new AddFactCommand(mod.stores, mod.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('addFact');
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
