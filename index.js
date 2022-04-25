// The simplest LISK application
//import { NaiveModule } from "./modules/naive/naive_module.ts";
const { NaiveModule } = require('./modules/naive/naive_module.ts')

const { Application } = require('lisk-sdk');
const { DashboardPlugin } = require('@liskhq/lisk-framework-dashboard-plugin');

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

app.registerModule(NaiveModule);
app.registerPlugin(DashboardPlugin);
app.run();