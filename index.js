// The simplest LISK application

const { Application } = require('lisk-sdk');
const { DashboardPlugin } = require('@liskhq/lisk-framework-dashboard-plugin');

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

app.registerPlugin(DashboardPlugin);
app.run();