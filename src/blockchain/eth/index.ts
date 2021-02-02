import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthMethodsERC20 } from './EthMethodsERC20';
import { EthManager } from './EthManager';

import ethManagerJson = require('../contracts/LINKEthManager.json');
import erc20Json = require('../contracts/MyERC20.json');
import multiSigWalletJson = require('../contracts/MultiSigWallet.json');
import tokenManagerJson = require('../contracts/TokenManager.json');
import busdJson = require('../contracts/IBUSD.json');
import ethManagerERC20Json = require('../contracts/EthManagerERC20.json');
import ethManagerHRC20Json = require('../contracts/EthManagerHRC20.json');
import ethManagerERC721Json = require('../contracts/ERC721EthManager.json');
import { EthEventsTracker } from './EthEventsTracker';
import { EthMethodsERC721 } from './EthMethodsERC721';
import { EthMethodsHRC20 } from './EthMethodsHRC20';
import { EthTokensTracker } from './EthTokensTracker';

export * from './EthMethods';
export * from './EthMethodsERC20';
export * from './EthMethodsHRC20';
export * from './EthMethodsERC721';

export const web3URL = `${process.env.ETH_NODE_URL}/${process.env.INFURA_PROJECT_ID}`;

/**
 * Refreshes provider instance and attaches even handlers to it
 */

export const web3 = new Web3(web3URL);

const ethManagerBUSD = new EthManager(ethManagerJson, process.env.ETH_BUSD_MANAGER_CONTRACT);
const ethTokenBUSD = new EthManager(busdJson, process.env.ETH_BUSD_CONTRACT);

const ethManagerLINK = new EthManager(ethManagerJson, process.env.ETH_LINK_MANAGER_CONTRACT);
const ethTokenLINK = new EthManager(erc20Json, process.env.ETH_LINK_CONTRACT);

const ethMultiSigManager = new EthManager(multiSigWalletJson, process.env.ETH_MULTISIG_WALLET);

const ethTokenManager = new EthManager(tokenManagerJson, process.env.ETH_TOKEN_MANAGER_CONTRACT);

const ethEventsTracker = new EthEventsTracker({
  ethManager: ethMultiSigManager,
  web3,
  eventName: 'Submission',
});

const ethTokensEventsTracker = new EthEventsTracker({
  ethManager: ethTokenManager,
  web3,
  eventName: 'TokenMapAck',
});

export const ethMethodsBUSD = new EthMethods({
  web3,
  ethManager: ethManagerBUSD,
  ethMultiSigManager,
  ethToken: ethTokenBUSD,
  ethEventsTracker,
});

export const ethMethodsLINK = new EthMethods({
  web3,
  ethManager: ethManagerLINK,
  ethMultiSigManager,
  ethToken: ethTokenLINK,
  ethEventsTracker,
});

const ethManagerERC20 = new EthManager(ethManagerERC20Json, process.env.ETH_ERC20_MANAGER_CONTRACT);
const ethManagerHRC20 = new EthManager(ethManagerHRC20Json, process.env.ETH_HRC20_MANAGER_CONTRACT);
const ethManagerERC721 = new EthManager(
  ethManagerERC721Json,
  process.env.ETH_ERC721_MANAGER_CONTRACT
);
const ethManagerETH = new EthManager(ethManagerERC20Json, process.env.ETH_MANAGER_CONTRACT);

export const ethMethodsERC20 = new EthMethodsERC20({
  web3,
  ethManager: ethManagerERC20,
  ethMultiSigManager,
  ethToken: ethTokenBUSD,
  ethEventsTracker,
});

export const ethMethodsHRC20 = new EthMethodsHRC20({
  web3,
  ethManager: ethManagerHRC20,
  ethMultiSigManager,
  ethToken: ethTokenBUSD,
  ethEventsTracker,
});

export const ethMethodsETH = new EthMethodsERC20({
  web3,
  ethManager: ethManagerETH,
  ethMultiSigManager,
  ethToken: ethTokenBUSD,
  ethEventsTracker,
});

export const ethMethodsERC721 = new EthMethodsERC721({
  web3,
  ethManager: ethManagerERC721,
  ethMultiSigManager,
  ethToken: ethTokenBUSD,
  ethEventsTracker,
});

export const ethTokensTracker = new EthTokensTracker({
  ethEventsTracker: ethTokensEventsTracker,
  ethMethods: ethMethodsERC20,
  web3,
});
