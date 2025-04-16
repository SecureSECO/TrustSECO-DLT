import { BaseEndpoint, ModuleEndpointContext } from 'lisk-sdk';
import { Keys, KeysStore, keyIndex } from './stores/keys';

export class AccountsEndpoint extends BaseEndpoint {
	public async getKeys(ctx: ModuleEndpointContext): Promise<Keys> {
		const keysStore = this.stores.get(KeysStore);
		const keys = await keysStore.get(
			ctx,
			keyIndex
		);
		return keys;
	}
}
