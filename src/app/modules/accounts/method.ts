import { BaseMethod, ImmutableMethodContext, MethodContext } from 'lisk-sdk';
import { KeysStore, keyIndex } from './stores/keys';
import { Account, AccountStore } from './stores/account';

export class AccountsMethod extends BaseMethod {
	public async getKeys(ctx: ImmutableMethodContext): Promise<string[]> {
		const keysStore = this.stores.get(KeysStore);
		const keys = await keysStore.get(
			ctx,
			keyIndex
		);
		return keys.keys.map(key => key.key);
	}
	
	/** Add amount to account balance (negative to lower account balance)*/
	public async changeBalance(ctx: MethodContext, uid: string, amount: bigint) {
		const accountStore = this.stores.get(AccountStore);
		let account = await accountStore.get(ctx, Buffer.from(uid))
		account.slingers += amount;
		if (account.slingers < 0) {
			throw new Error("Can complete transaction: account balance to low");
		}
		await accountStore.set(ctx, Buffer.from(uid), account);
	}

	public async getAccount(ctx: MethodContext, uid: string): Promise<Account> {
		const accountStore = this.stores.get(AccountStore);
		return await accountStore.get(ctx, Buffer.from(uid))
	}
}
