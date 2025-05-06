import { BaseEndpoint, ModuleEndpointContext } from 'klayr-sdk';
import { Keys, KeysStore, keyIndex } from './stores/keys';
import { AccountSerial, AccountStore } from './stores/account';

export class AccountsEndpoint extends BaseEndpoint {
	public async getKeys(ctx: ModuleEndpointContext): Promise<Keys> {
		const keysStore = this.stores.get(KeysStore);
		const keys = await keysStore.get(ctx, keyIndex);
		return keys;
	}
	public async getAccount(ctx: ModuleEndpointContext): Promise<AccountSerial> {
		const uid = ctx.params.uid;
		const accountStore = this.stores.get(AccountStore);
		if (typeof uid !== 'string') {
            throw new Error('Parameter uid must be a string.');
        }
		if (!await accountStore.has(ctx, Buffer.from(uid))){
			throw new Error('No account exists for givin uid')
		}
	
		const account = await accountStore.get(ctx, Buffer.from(uid))
		
		return { slingers: account.slingers.toString() };
	}
}
