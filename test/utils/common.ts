import { Transaction, testing, Schema, codec, cryptography, BaseCommand, CommandExecuteContext } from 'lisk-sdk';

export function createTransaction(
	params: any,
	paramsSchema: Schema,
	nonce: number,
	commandName: string,
): Transaction {
	return new Transaction({
		module: 'packageData',
		command: commandName,
		senderPublicKey: Buffer.from(
			'3bb9a44b71c83b95045486683fc198fe52dcf27b55291003590fcebff0a45d9a',
			'hex',
		),
		nonce: BigInt(nonce),
		fee: BigInt(100000000),
		params: codec.encode(paramsSchema, params),
		signatures: [cryptography.utils.getRandomBytes(64)],
	});
}

export async function executeTransaction<CommandType extends BaseCommand>(
	command: CommandType,
	stateStore: any,
	transaction: Transaction,
	paramsSchema: Schema,
): Promise<CommandExecuteContext<CommandType>> {
	const context = testing
		.createTransactionContext({
			stateStore,
			transaction,
			header: testing.createFakeBlockHeader({}),
		})
		.createCommandExecuteContext<CommandType>(paramsSchema);
	await command.execute(context);
    return context
}

export async function createAndExecuteTransaction<CommandType extends BaseCommand>(
	params: any,
	paramsSchema: Schema,
	nonce: number,
	command: CommandType,
	stateStore: any,
): Promise<CommandExecuteContext<CommandType>> {
    const trans = createTransaction(params, paramsSchema, nonce, command.name);
    return await executeTransaction(command, stateStore, trans, paramsSchema);
}
