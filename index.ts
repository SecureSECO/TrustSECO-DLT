// The simplest LISK application

require('dotenv').config();

import { Application } from 'lisk-sdk';
import { DashboardPlugin } from '@liskhq/lisk-framework-dashboard-plugin';

import { NaiveModule } from "./modules/naive/naive_module";
import { CodaModule } from "./modules/coda/coda-module";
import { TrustFactsModule } from "./modules/trustfacts/trustfacts_module"

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

if (config.plugins.dashboard.applicationUrl == "auto") {
    let hostname = process.env.HOSTNAME ?? "localhost";
    config.plugins.dashboard.applicationUrl = `ws://${hostname}:${config.rpc.port}/ws`;
}

const app = Application.defaultApplication(genesisBlock, config);

app.registerModule(NaiveModule);
app.registerModule(CodaModule);
app.registerModule(TrustFactsModule);
app.registerPlugin(DashboardPlugin);

app.run();