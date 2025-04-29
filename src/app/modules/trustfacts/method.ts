import { BaseMethod, ImmutableMethodContext } from 'lisk-sdk';
import { StoreTrustFact, TrustFactsStore, trustFactsIndex } from './stores/trustfacts'

export class TrustfactsMethod extends BaseMethod {
    public async getTrustFacts(context: ImmutableMethodContext, params: { packageName: string, packageOwner?: string, packagePlatform?: string, packageRelease?: string}): Promise<StoreTrustFact[]> {
		const trustfactsStore = this.stores.get(TrustFactsStore);
		const trustfacts = await trustfactsStore.get(context, trustFactsIndex);
		const { packageName, packageRelease } = params;
		if (typeof packageName !== 'string') {
			throw new Error('Parameter packageName must be a string.');
		}
        // TODO: also filter on owner and platform
		const pack = trustfacts.facts.filter(
			fact =>
				fact.packageName === packageName &&
				(typeof packageRelease !== 'string' || fact.version === packageRelease)
		);
		return pack;
    }
}
