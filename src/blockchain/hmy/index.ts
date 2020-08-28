import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { HmyManager } from './HmyManager';
import { HmyMethods } from './HmyMethods';

import hmyBUSDManagerJson = require('../contracts/BUSDHmyManager.json');
import hmyLINKManagerJson = require('../contracts/LINKHmyManager.json');
import hmyBUSDTokenJson = require('../contracts/BUSDImplementation.json');
import hmyLINKTokenJson = require('../contracts/LinkToken.json');

export * from './HmyMethods';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

const busdContract = hmy.contracts.createContract(
  hmyBUSDTokenJson.abi,
  process.env.HMY_BUSD_CONTRACT
);

const linkContract = hmy.contracts.createContract(
  hmyLINKTokenJson.abi,
  process.env.HMY_BUSD_CONTRACT
);

const hmyBUSDManager = new HmyManager(hmyBUSDManagerJson, process.env.HMY_MANAGER_CONTRACT);
const hmyLINKManager = new HmyManager(hmyLINKManagerJson, process.env.HMY_LINK_MANAGER_CONTRACT);

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
