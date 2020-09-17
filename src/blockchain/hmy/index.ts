import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { HmyManager } from './HmyManager';
import { HmyMethods } from './HmyMethods';

import hmyManagerJson = require('../contracts/HmyManager.json');
import TokenManagerJson = require('../contracts/TokenManager.json');
import erc20Json = require('../contracts/IERC20.json');

export * from './HmyMethods';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

const hmyManager = new HmyManager(hmyManagerJson, process.env.HMY_MANAGER_CONTRACT);
const hmyTokenManager = new HmyManager(TokenManagerJson, process.env.TOKEN_MANAGER_CONTRACT);

// fake address - using only for logs decode
const hmyTokenContract = hmy.contracts.createContract(erc20Json.abi, '');

export const hmyMethods = new HmyMethods({
  hmySdk: hmy,
  hmyTokenContract: hmyTokenContract,
  hmyTokenManager: hmyTokenManager,
  hmyManager: hmyManager,
});
