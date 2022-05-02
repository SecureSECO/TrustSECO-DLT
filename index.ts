// The simplest LISK application
//const { NaiveModule } = require('./modules/naive/naive_module.js')

import { Application } from 'lisk-sdk';
import { DashboardPlugin } from '@liskhq/lisk-framework-dashboard-plugin';

import { NaiveModule } from "./modules/naive/naive_module";
import { CodaModule } from  "./modules/coda/coda-module";

const genesisBlock = require ('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

app.registerModule(NaiveModule);
app.registerModule(CodaModule);
app.registerPlugin(DashboardPlugin);

app.run();