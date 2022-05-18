import { BlockHeader } from '@liskhq/lisk-chain';
import { Transaction, ValidateAssetContext } from 'lisk-sdk';
import { TrustFact } from '../trustfacts_schema';
import { TrustFactsAddFactAsset } from './addfact_asset';

const trustfacts = new TrustFactsAddFactAsset();
describe('Test the validate function', () => {
    test('Throw an error if the asset factdata is empty', () => {
        const asset : ValidateAssetContext<TrustFact> = {
            asset: {
                factData: '',
                jobID: 0,
                gitSignature: '',
                keyURL: '',
            },
            transaction: {} as Transaction,
            header: {} as BlockHeader
        }
        expect(() => { trustfacts.validate(asset) }).toThrow();
    });
});