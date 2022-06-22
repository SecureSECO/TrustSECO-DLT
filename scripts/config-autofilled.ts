import path = require('path');
import { ApplicationConfig, PartialApplicationConfig } from 'lisk-sdk';
import dotenv = require('dotenv');
dotenv.config();

import config = require('../config/config.json');

if (config.plugins.dashboard.applicationUrl == "auto") {
    const hostname = process.env.HOSTNAME ?? "localhost";
    config.plugins.dashboard.applicationUrl = `ws://${hostname}:${config.rpc.port}/ws`;
}

if (config.rootPath == "auto") {
    const dir = process.env.LISK_DIRECTORY ?? "~";
    config.rootPath = path.join(dir, '.lisk');
}

checkauto(config);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkauto(object : any, path='') {
    for (const key in object) {
        path = path + key;
        const value = object[key];
        if (value === 'auto') {
            throw new Error(`./config/config.json : ${path} is set to 'auto', but ./scripts/config-autofill.ts does not now how to set this value.`);
        }
        else if (typeof value === 'object') {
            checkauto(value, path);
        }
    }
}

export default config as PartialApplicationConfig as ApplicationConfig;