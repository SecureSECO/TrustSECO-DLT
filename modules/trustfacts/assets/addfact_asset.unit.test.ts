import { TrustFactsAddFactAsset } from './addfact_asset';

const trustfacts = new TrustFactsAddFactAsset();
describe('Test the validate function', () => {
    test('Throw an error if the asset factdata is empty', () => {
        const asset = {
            asset: {
                factData: ''
            }
        }
        expect(() => { trustfacts.validate(asset) }).toThrow();
    });
});