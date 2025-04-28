import { BaseMethod, ImmutableMethodContext } from 'lisk-sdk';
import { StoreTrustFact } from './stores/trustfacts'

export class TrustfactsMethod extends BaseMethod {
    public async getTrustFacts(_context: ImmutableMethodContext, _params: { packageName: string, packageOwner?: string, packagePlatform?: string, packageRelease?: string}): Promise<StoreTrustFact[]> {
        throw new Error("Not implemented yet: get trust facts");
    }
}
