/* eslint-disable */

const { TokenModule, DPoSModule, KeysModule, SequenceModule } = require('lisk-sdk');
const config = require('./config.json');

const { NaiveModule } = require('../dist/modules/naive/naive_module');
const { CodaModule } = require('../dist/modules/coda/coda-module');
const { TrustFactsModule } = require('../dist/modules/trustfacts/trustfacts_module');

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
    new TrustFactsModule(config.genesisConfig),
]

module.exports.modules = modules;
