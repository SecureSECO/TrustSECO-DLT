import { AccountsAddAsset } from "./accounts-add-asset";

const accounts = new AccountsAddAsset();

describe('Test the validate function of AccountsAddAsset', () => {
    test('Throw an error if the Github GPG url is invalid', () => {
        const asset = { url: 'https://github.com/.gpg' };
        const transaction = undefined as never;
        const header = undefined as never;
        expect(() => accounts.validate({ asset, transaction, header })).toThrowError();
    });
});