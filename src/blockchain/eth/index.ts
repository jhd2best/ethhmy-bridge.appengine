import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthManager } from './EthManager';

import ethBUSDManagerJson = require('../contracts/BUSDEthManager.json');
import ethLINKManagerJson = require('../contracts/LINKEthManager.json');

export * from './EthMethods';

export const web3URL = process.env.ETH_NODE_URL;
export const web3 = new Web3(web3URL);

export const ethManagerBUSD = new EthManager(ethBUSDManagerJson, process.env.ETH_MANAGER_CONTRACT);

export const ethManagerLINK = new EthManager(
  ethLINKManagerJson,
  process.env.ETH_LINK_MANAGER_CONTRACT
);

export const ethMethodsBUSD = new EthMethods({ web3, ethManager: ethManagerBUSD });
export const ethMethodsLINK = new EthMethods({ web3, ethManager: ethManagerLINK });
