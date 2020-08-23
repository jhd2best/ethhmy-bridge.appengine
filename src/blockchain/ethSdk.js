"use strict";
exports.__esModule = true;
exports.managerContract = exports.ethBUSDContract = exports.web3 = exports.web3URL = void 0;
var web3_1 = require("web3");
exports.web3URL = process.env.ETH_NODE_URL;
exports.web3 = new web3_1["default"](exports.web3URL);
// eslint-disable-next-line @typescript-eslint/no-var-requires
var ethBUSDJson = require('../contracts/BUSDImplementation.json');
exports.ethBUSDContract = new exports.web3.eth.Contract(ethBUSDJson.abi, process.env.ETH_BUSD_CONTRACT);
// eslint-disable-next-line @typescript-eslint/no-var-requires
var EthManagerJson = require('../contracts/BUSDEthManager.json');
exports.managerContract = new exports.web3.eth.Contract(EthManagerJson.abi, process.env.ETH_MANAGER_CONTRACT);
