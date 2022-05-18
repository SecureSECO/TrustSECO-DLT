//, ApplyAssetContext, ValidateAssetContext, codec

import { BaseAsset} from 'lisk-sdk';

export class FactMessageAsset extends BaseAsset {
	public name = 'factMessage';
	public id = 1;

	// Define schema for asset
	public schema = {
		$id: 'lisk/naive/asset',
		type: 'object',
		required: ["trustFactJSON"],
		properties: {
			trustFactJSON: {
				dataType: 'string', 
				fieldNumber: 1, 
				minLength: 3, 
				maxLength: 10000, 
			},
		},
	};

	public validate({ asset }): void {
		if(asset.trustFactJSON == ""){
			throw new Error(
				'Illegal message: ${asset.trustFactJSON}'
			);
		}
	}

	public async apply({ asset, transaction, stateStore }): Promise<void> {
		// 1. Get account data of the sender of the transaction
		const senderAddress = transaction.senderAddress;
		const senderAccount = await stateStore.account.get(senderAddress);

		// 2. Update account data
		senderAccount.naive.trustFacts += asset.trustFactJSON;
		stateStore.account.set(senderAccount.address, senderAccount);
	}
}
