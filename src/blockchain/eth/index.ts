import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthManager } from './EthManager';

import ethManagerJson = require('../contracts/EthManager.json');

export * from './EthMethods';

export const web3URL = process.env.ETH_NODE_URL;
export const web3 = new Web3(web3URL);

const ethManager = new EthManager(ethManagerJson, process.env.ETH_MANAGER_CONTRACT);

export const ethMethods = new EthMethods({
  web3,
  ethManager,
});
