"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const naive_module_1 = require("./modules/naive/naive_module");
const lisk_sdk_1 = require("lisk-sdk");
const lisk_framework_dashboard_plugin_1 = require("@liskhq/lisk-framework-dashboard-plugin");
const genesisBlock = require('./config/genesis-block.json');
const config = require('./config/config.json');
const app = lisk_sdk_1.Application.defaultApplication(genesisBlock, config);
app.registerModule(naive_module_1.NaiveModule);
app.registerPlugin(lisk_framework_dashboard_plugin_1.DashboardPlugin);
app.run();
//# sourceMappingURL=index.js.map