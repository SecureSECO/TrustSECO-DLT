// written by Wilco Verhoef for Fides

const prompt = require('prompt');

prompt.start().get({
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

    const { genesis, passphrase, cryptography } = require('lisk-sdk');
    const config = require('./config.json');
    const { writeFileSync } = require('fs');
    const path = require('path');
    const { modules } = require('./modules.js');

    // NOTE: LIST OF MODULES HAS MOVED TO A SEPARATE FILE

    const accountAssetSchemas = {};

    let fields = 1;
    for (let module of modules) {
        if (module.accountSchema !== undefined) {
            const schema = module.accountSchema;
            schema.fieldNumber = ++fields;
            accountAssetSchemas[module.name] = schema;
        }
    }



    // GENERATING A LIST OF GENESIS DELEGATES AND ACCOUNTS

    function newCredentials() {
        const pass = passphrase.Mnemonic.generateMnemonic();
        const keys = cryptography.getPrivateAndPublicKeyFromPassphrase(pass);
        const credentials = {
            address: cryptography.getBase32AddressFromPassphrase(pass),
            binaryAddress: cryptography.getAddressFromPassphrase(pass).toString("hex"),
            passphrase: pass,
            publicKey: keys.publicKey.toString("hex"),
            privateKey: keys.privateKey.toString("hex")
        };
        return credentials;
    };

    function newAccount(balance, delegateName = null) {
        const cred = newCredentials();
        const address = Buffer.from(cred.binaryAddress, 'hex');
        const account = {
            address,
            token: { balance: BigInt(balance) },
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
                address,
                encryptedPassphrase,
                hashOnion: { count, distance, hashes }
            });
        }

        credentials.push({...account, cred});

        return account;
    }

    config.forging.delegates = [];

    credentials = [];

    delegates = [
        newAccount(100000000, 'genesisDelegate1'),
        newAccount(100000000, 'genesisDelegate2'),
        newAccount(100000000, 'genesisDelegate3'),
        newAccount(100000000, 'genesisDelegate4'),
        newAccount(100000000, 'genesisDelegate5'),
    ];

    accounts = [
        ...delegates,
        newAccount(25000000000),
        newAccount(25000000000),
        newAccount(25000000000),
    ];



    // CREATING THE GENESIS BLOCK

    const genesisBlock = genesis.createGenesisBlock({
        initDelegates: delegates.map(a => a.address),
        accounts,
        accountAssetSchemas,
        initRounds: 3,
    });


    BigInt.prototype.toJSON = function () { return this.toString() };
    Buffer.prototype.toJSON = function () { return this.toString('hex') };

    writeFileSync(path.resolve(__dirname,'genesis-block.json'), JSON.stringify(genesisBlock, null, 4));
    console.log('Written genesis-block.json');

    writeFileSync(path.resolve(__dirname,'config.json'), JSON.stringify(config, null, 4));
    console.log('Updated config.json');
    
    writeFileSync(path.resolve(__dirname,'accounts.json'), JSON.stringify(credentials, null, 4));
    console.log('Updated accounts.json');
}
