import semver = require('semver');
import prompt = require('prompt');

import { genesis, passphrase, cryptography, AccountSchema } from 'lisk-sdk';
import config = require('../config/config.json');
import { writeFileSync } from 'fs';
import { modules } from '../config/modules';
import { Account } from '@liskhq/lisk-chain';

prompt.start();
prompt.get({
    properties: {
        confirmation: {
            description: 'Have you added all new modules to config/modules.js? (y|n)',
            pattern: /^(y|n)$/,
            message: 'Please confirm with `y` or cancel with `n`',
            required: true
        }
    }
}, (_, { confirmation }) => {

    if (confirmation === 'y') createGenesisBlock();
    else console.log('Okay, goodbye!');

});

function createGenesisBlock() {
    // NOTE: LIST OF MODULES HAS MOVED TO A SEPARATE FILE

    const accountAssetSchemas: {[key:string] : AccountSchema & {fieldNumber: number}} = {};

    let fields = 1;
    for (const module of modules) {
        if (module.accountSchema !== undefined) {
            const schema = module.accountSchema;
            accountAssetSchemas[module.name] = { ...schema, fieldNumber: ++fields };
        }
    }

    // GENERATING A LIST OF GENESIS DELEGATES AND ACCOUNTS
    function newCredentials(chosenPassPhrase?: string) {
        const pass = chosenPassPhrase ?? passphrase.Mnemonic.generateMnemonic();
        const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(pass);
        const credentials = {
            address: cryptography.getBase32AddressFromPassphrase(pass),
            binaryAddress: cryptography.getAddressFromPassphrase(pass).toString("hex"),
            passphrase: pass,
            publicKey: keys.publicKey.toString("hex"),
            privateKey: keys.privateKey.toString("hex")
        };
        return credentials;
    }

    function newAccount(balance: bigint, delegateName: string | null = null, chosenPassPhrase?: string) {
        const cred = newCredentials(chosenPassPhrase);
        const address = Buffer.from(cred.binaryAddress, 'hex');
        const account : Partial<Account> & { address: Buffer } = {
            address,
            token: { balance: balance }
        };
        if (delegateName) {
            account.dpos = { delegate: { username: delegateName } };

            console.log('encrypting password for delegate...');

            const encrypted = cryptography.encryptPassphraseWithPassword(cred.passphrase, 'fides is awesome');
            const encryptedPassphrase = cryptography.stringifyEncryptedPassphrase( encrypted );

            const count = 10000;
            const distance = 1000;
            const seed = cryptography.generateHashOnionSeed();
            const hashes = cryptography.hashOnion(seed, count, distance).map(b => b.toString('hex'));

            config.forging.delegates.push({
                address: address.toString('hex'),
                encryptedPassphrase,
                hashOnion: { count, distance, hashes }
            });
        }

        credentials.push({...account, cred});

        return account;
    }

    config.forging.delegates = [];

    const credentials : Account[] = [];

    const numberOfTokens = BigInt("1000000000000000000");

    const delegates = [
        newAccount(numberOfTokens, 'fidesContributor', 'wat het nu is ofzo maakt me echt niet uit'),
        newAccount(numberOfTokens, 'genesisDelegate1'),
        newAccount(numberOfTokens, 'genesisDelegate2'),
        newAccount(numberOfTokens, 'genesisDelegate3'),
        newAccount(numberOfTokens, 'genesisDelegate4'),
        newAccount(numberOfTokens, 'genesisDelegate5'),
    ];

    const accounts = [
        ...delegates,
        newAccount(numberOfTokens),
        newAccount(numberOfTokens),
        newAccount(numberOfTokens),
    ];

    // CREATING THE GENESIS BLOCK
    const genesisBlock = genesis.createGenesisBlock({
        initDelegates: delegates.map(a => a.address),
        accounts,
        accountAssetSchemas,
        initRounds: 3,
    });

    Buffer.prototype.toJSON = function () { return this.toString('hex') };

    const replacer = (_:string, val:unknown) => typeof val === 'bigint' ? val.toString() : val;

    writeFileSync('./config/genesis-block.json', JSON.stringify(genesisBlock, replacer, 4));
    console.log('Written genesis-block.json');

    const old_version = config.version;
    const random_suffix = Math.random().toString(16).substring(2, 6);
    config.version = semver.inc(semver.coerce(config.version) as semver.SemVer, 'patch') + '-' + random_suffix;

    writeFileSync('./config/config.json', JSON.stringify(config, replacer, 4));
    console.log(`Updated config.json, ${old_version} -> ${config.version}`);
    
    writeFileSync('./config/accounts.json', JSON.stringify(credentials, replacer, 4));
    console.log('Updated accounts.json');
}