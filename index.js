// The simplest LISK application

const { Application } = require('lisk-sdk');

const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');

const app = Application.defaultApplication(genesisBlock, config);

// Export function so CoSy can call it.
module.exports = {
    start() {
        app.run();
    }
}

// Call start if file is ran by 'node index.js'
module.exports.start();
