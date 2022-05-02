const { TokenModule, DPoSModule, KeysModule, SequenceModule } = require('lisk-sdk');
const config = require('./config.json');

// const { CodaModule } = require('../modules/coordination-database/coda-module');

const modules = [

    // Default Modules
    new TokenModule(config.genesisConfig),
    new DPoSModule(config.genesisConfig),
    new KeysModule(config.genesisConfig),
    new SequenceModule(config.genesisConfig),

    // ADD ALL MODULES HERE
    // (don't forget to import them)
    
    // new CodaModule(config.genesisConfig),
]

module.exports.modules = modules;
