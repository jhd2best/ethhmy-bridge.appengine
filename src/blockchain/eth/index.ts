import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthMethodsERC20 } from './EthMethodsERC20';
import { EthManager } from './EthManager';

import ethManagerJson = require('../contracts/LINKEthManager.json');
import erc20Json = require('../contracts/MyERC20.json');
import busdJson = require('../contracts/IBUSD.json');
import ethManagerERC20Json = require('../contracts/EthManagerERC20.json');
import { sleep } from '../utils';

export * from './EthMethods';
export * from './EthMethodsERC20';

export const web3URL = process.env.ETH_NODE_URL;
export const web3URLWS = process.env.ETH_NODE_URL_WS;

export const ethWSProvider = new Web3.providers.WebsocketProvider(web3URLWS)

export const web3 = new Web3(web3URL);
export const web3WS = new Web3(ethWSProvider);

// const ping = async () => {
//   while (true) {
//     if (!ethWSProvider.connected) {
//       console.log('-ETH_WS Connected: ', ethWSProvider.connected);
//     }
//     await sleep(3000);
//   }
// };
//
// ping();

const ethManagerBUSD = new EthManager(ethManagerJson, process.env.ETH_BUSD_MANAGER_CONTRACT);
const ethTokenBUSD = new EthManager(busdJson, process.env.ETH_BUSD_CONTRACT);

const ethManagerLINK = new EthManager(ethManagerJson, process.env.ETH_LINK_MANAGER_CONTRACT);
const ethTokenLINK = new EthManager(erc20Json, process.env.ETH_LINK_CONTRACT);

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

const ethManagerERC20 = new EthManager(ethManagerERC20Json, process.env.ETH_ERC20_MANAGER_CONTRACT);

export const ethMethodsERC20 = new EthMethodsERC20({
  web3,
  ethManager: ethManagerERC20,
});
