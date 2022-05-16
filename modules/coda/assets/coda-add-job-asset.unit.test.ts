import { CodaAddJobAsset } from './coda-add-job-asset';

const coda = new CodaAddJobAsset();
describe('Test the validate function', () => {
    test('Throw an error if the asset package is empty', () => {
        const asset = {
            asset: {
                package: '',
                source: 'github',
                fact: 'stars'
            }
        }
        expect(() => { coda.validate(asset) }).toThrow();
    });
    test('Throw an error if the asset has an unknown source', () => {
        const asset = {
            asset: {
                package: 'Some package',
                source: 'Unknown',
                fact: 'stars'
            }
        }
        expect(() => { coda.validate(asset) }).toThrow();
    })
    test('Throw an error if the given fact is unknown for the asset source', () => {
        const asset = {
            asset: {
                package: 'Some package',
                source: 'github',
                fact: 'unknown'
            }
        }
        expect(() => { coda.validate(asset) }).toThrow();
    })
});

