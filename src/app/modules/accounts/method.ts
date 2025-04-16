import { BaseMethod, ImmutableMethodContext } from 'lisk-sdk';
import { Keys, KeysStore, keyIndex } from './stores/keys';

export class AccountsMethod extends BaseMethod {
	public async getKeys(ctx: ImmutableMethodContext): Promise<Keys> {
		const keysStore = this.stores.get(KeysStore);
		const keys = await keysStore.get(
			ctx,
			keyIndex
		);
		return keys;
	}
}
