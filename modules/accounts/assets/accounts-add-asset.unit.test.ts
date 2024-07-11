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

/*
This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
© Copyright Utrecht University (Department of Information and Computing Sciences)
*/