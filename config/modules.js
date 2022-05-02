const { TokenModule, DPoSModule, KeysModule, SequenceModule } = require('lisk-sdk');
const config = require('./config.json');

const { NaiveModule } = require('../dist/modules/naive/naive_module');
const { CodaModule } = require('../dist/modules/coda/coda-module');

const modules = [

    // Default Modules
    new TokenModule(config.genesisConfig),
    new DPoSModule(config.genesisConfig),
    new KeysModule(config.genesisConfig),
    new SequenceModule(config.genesisConfig),

    // ADD ALL MODULES HERE
    // (don't forget to import them)
    
    new NaiveModule(config.genesisConfig),
    new CodaModule(config.genesisConfig),
]

module.exports.modules = modules;
