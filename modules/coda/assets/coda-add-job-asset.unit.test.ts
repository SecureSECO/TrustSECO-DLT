import { BlockHeader } from '@liskhq/lisk-chain';
import { Transaction, ValidateAssetContext } from 'lisk-sdk';
import { CodaJob } from '../coda-schemas';
import { CodaAddJobAsset } from './coda-add-job-asset';

const coda = new CodaAddJobAsset();
describe('Test the validate function', () => {
    test('Throw an error if the asset package is empty', () => {
        const asset : ValidateAssetContext<CodaJob> = {
            asset: {
                package: '',
                source: 'github', 
                fact: 'stars',
                date: "2000-01-01"
            },
            transaction: {} as Transaction,
            header: {} as BlockHeader
        }
        expect(() => { coda.validate(asset) }).toThrow();
    });
    test('Throw an error if the asset has an unknown source', () => {
        const asset : ValidateAssetContext<CodaJob> = {
            asset: {
                package: 'Some package',
                source: 'Unknown',
                fact: 'stars',
                date: "2000-01-01"
            },
            transaction: {} as Transaction,
            header: {} as BlockHeader
        }
        expect(() => { coda.validate(asset) }).toThrow();
    })
    test('Throw an error if the given fact is unknown for the asset source', () => {
        const asset : ValidateAssetContext<CodaJob> = {
            asset: {
                package: 'Some package',
                source: 'github',
                fact: 'unknown',
                date: "2000-01-01"
            },
            transaction: {} as Transaction,
            header: {} as BlockHeader
        }
        expect(() => { coda.validate(asset) }).toThrow();
    })
});

