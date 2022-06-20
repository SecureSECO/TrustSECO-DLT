import { Transaction, ValidateAssetContext } from "lisk-sdk";
import { AccountURL } from "../accounts-schemas";
import { AccountsAddAsset } from "./accounts-add-asset";
import { BlockHeader } from '@liskhq/lisk-chain';

const accounts = new AccountsAddAsset();

describe('Test the validate function of AccountsAddAsset', () => {
    test('Throw an error if the Github GPG url is invalid', () => {
        const asset: ValidateAssetContext<AccountURL> = {
            asset: {
                url: 'https://github.com/.gpg'
            },
            transaction: {} as Transaction,
            header: {} as BlockHeader
        };
        expect(() => accounts.validate(asset)).toThrowError();
    });
});