// The simplest LISK application

const { Application } = require('lisk-sdk');

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

app.run();
