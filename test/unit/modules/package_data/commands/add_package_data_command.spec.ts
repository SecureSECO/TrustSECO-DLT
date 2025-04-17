import { AddPackageDataCommand } from '../../../../../src/app/modules/packageData/commands/add_package_data_command';

describe('AddPackageDataCommand', () => {
  let command: AddPackageDataCommand;

	beforeEach(() => {
		command = new AddPackageDataCommand();
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('AddPackageData');
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
