import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { HmyManager } from './HmyManager';
import { HmyMethods } from './HmyMethods';

import hmyManagerJson = require('../contracts/LINKHmyManager.json');
import hmyManagerERC20Json = require('../contracts/HmyManagerERC20.json');
import erc20Json = require('../contracts/MyERC20.json');
import { HmyMethodsERC20 } from './HmyMethodsERC20';

export * from './HmyMethods';
export * from './HmyMethodsERC20';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

const busdContract = hmy.contracts.createContract(erc20Json.abi, process.env.HMY_BUSD_CONTRACT);

const linkContract = hmy.contracts.createContract(erc20Json.abi, process.env.HMY_LINK_CONTRACT);

const hmyBUSDManager = new HmyManager(hmyManagerJson, process.env.HMY_BUSD_MANAGER_CONTRACT);
const hmyLINKManager = new HmyManager(hmyManagerJson, process.env.HMY_LINK_MANAGER_CONTRACT);

export const hmyMethodsBUSD = new HmyMethods({
  hmySdk: hmy,
  hmyTokenContract: busdContract,
  hmyManager: hmyBUSDManager,
});

export const hmyMethodsLINK = new HmyMethods({
  hmySdk: hmy,
  hmyTokenContract: linkContract,
  hmyManager: hmyLINKManager,
});

// ERC20
const hmyManagerERC20 = new HmyManager(hmyManagerERC20Json, process.env.HMY_ERC20_MANAGER_CONTRACT);
// fake address - using only for logs decode
const hmyTokenContract = hmy.contracts.createContract(erc20Json.abi, '');

export const hmyMethodsERC20 = new HmyMethodsERC20({
  hmySdk: hmy,
  hmyTokenContract: hmyTokenContract,
  hmyManager: hmyManagerERC20,
});
