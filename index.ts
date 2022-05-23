import dotenv = require('dotenv');
dotenv.config();

import { Application, PartialApplicationConfig } from 'lisk-sdk';
import { DashboardPlugin } from '@liskhq/lisk-framework-dashboard-plugin';

import { NaiveModule } from "./modules/naive/naive_module";
import { CodaModule } from "./modules/coda/coda-module";
import { TrustFactsModule } from "./modules/trustfacts/trustfacts_module"

import { checkVersion } from './scripts/check-version';

import genesisBlock = require('./config/genesis-block.json');
import config from './scripts/config-autofilled';

checkVersion().then(() => {

    const app = Application.defaultApplication(genesisBlock, config as PartialApplicationConfig);

    app.registerModule(NaiveModule);
    app.registerModule(CodaModule);
    app.registerModule(TrustFactsModule);
    app.registerPlugin(DashboardPlugin);

    app.run();

    console.log("TrustSECO-DLT is running...");

});
