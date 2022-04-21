// The simplest LISK application

const { Application } = require('lisk-sdk');
const { DashboardPlugin } = require('@liskhq/lisk-framework-dashboard-plugin');

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

app.registerPlugin(DashboardPlugin);

// Export function so CoSy can call it.
exports.start = () => app.run();

// Call start if file is ran by 'node index.js'
if (require.main === module)
    app.run();
