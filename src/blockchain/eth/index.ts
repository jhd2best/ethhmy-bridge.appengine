import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthManager } from './EthManager';

import ethBUSDManagerJson = require('../contracts/BUSDEthManager.json');
import ethLINKManagerJson = require('../contracts/LINKEthManager.json');

import ethBUSDTokenJson = require('../contracts/BUSDImplementation.json');
import ethLINKTokenJson = require('../contracts/LinkToken.json');

export * from './EthMethods';

export const web3URL = process.env.ETH_NODE_URL;
export const web3 = new Web3(web3URL);

const ethManagerBUSD = new EthManager(ethBUSDManagerJson, process.env.ETH_MANAGER_CONTRACT);
const ethTokenBUSD = new EthManager(ethBUSDTokenJson, process.env.ETH_BUSD_CONTRACT);

const ethManagerLINK = new EthManager(ethLINKManagerJson, process.env.ETH_LINK_MANAGER_CONTRACT);
const ethTokenLINK = new EthManager(ethLINKTokenJson, process.env.ETH_LINK_CONTRACT);

export const ethMethodsBUSD = new EthMethods({
  web3,
  ethManager: ethManagerBUSD,
  ethToken: ethTokenBUSD,
});

export const ethMethodsLINK = new EthMethods({
  web3,
  ethManager: ethManagerLINK,
  ethToken: ethTokenLINK,
});
