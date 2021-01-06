import { Harmony } from '@harmony-js/core';
import { ChainType } from '@harmony-js/utils';

import { HmyMethods } from './HmyMethods';

import { HmyMethodsERC20 } from './HmyMethodsERC20';
import { HmyMethodsHRC20 } from './HmyMethodsHRC20';
import { HmyEventsTracker } from './HmyEventsTracker';
import { HmyTokensTracker } from './HmyTokensTracker';
import { HmyMethodsERC721 } from './HmyMethodsERC721';
import { ethMethodsERC20, ethMethodsERC721 } from '../eth';

import tokenManagerJsonERC20 = require('../contracts/TokenManager.json');
import tokenManagerJsonERC721 = require('../contracts/NFTTokenManager.json');

export * from './HmyMethods';
export * from './HmyMethodsERC20';
export * from './HmyMethodsHRC20';
export * from './HmyMethodsERC721';

export const createHmySdk = () => {
  return new Harmony(
    // let's assume we deploy smart contract to this end-point URL
    process.env.HMY_NODE_URL,
    {
      chainType: ChainType.Harmony,
      chainId: Number(process.env.HMY_CHAIN_ID),
    }
  );
};

export const hmy = createHmySdk();

const hmyEventsTracker = new HmyEventsTracker({
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
});

export const hmyMethodsBUSD = new HmyMethods({
  hmyTokenContractAddress: process.env.HMY_BUSD_CONTRACT,
  hmyManagerAddress: process.env.HMY_BUSD_MANAGER_CONTRACT,
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
  hmyEventsTracker,
});

export const hmyMethodsLINK = new HmyMethods({
  hmyTokenContractAddress: process.env.HMY_LINK_CONTRACT,
  hmyManagerAddress: process.env.HMY_LINK_MANAGER_CONTRACT,
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
  hmyEventsTracker,
});

// ERC20
// const hmyManagerERC20 = new HmyManager(hmyManagerERC20Json, process.env.HMY_ERC20_MANAGER_CONTRACT);
// fake address - using only for logs decode

export const hmyMethodsERC20 = new HmyMethodsERC20({
  hmyTokenContractAddress: '',
  hmyManagerAddress: process.env.HMY_ERC20_MANAGER_CONTRACT,
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
  hmyEventsTracker,
});

export const hmyMethodsHRC20 = new HmyMethodsHRC20({
  hmyTokenContractAddress: '',
  hmyManagerAddress: process.env.HMY_HRC20_MANAGER_CONTRACT,
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
  hmyEventsTracker,
});

export const hmyMethodsERC721 = new HmyMethodsERC721({
  hmyTokenContractAddress: '',
  hmyManagerAddress: process.env.HMY_ERC721_MANAGER_CONTRACT,
  hmyManagerMultiSigAddress: process.env.HMY_MULTISIG_WALLET,
  hmyEventsTracker,
});

export const hmyTokensTrackerERC20 = new HmyTokensTracker({
  type: 'erc20',
  ethMethods: ethMethodsERC20,
  tokenManagerJsonAbi: tokenManagerJsonERC20.abi,
  tokenManagerAddress: process.env.TOKEN_MANAGER_CONTRACT,
});

export const hmyTokensTrackerERC721 = new HmyTokensTracker({
  type: 'erc721',
  ethMethods: ethMethodsERC721,
  tokenManagerJsonAbi: tokenManagerJsonERC721.abi,
  tokenManagerAddress: process.env.NFT_TOKEN_MANAGER_CONTRACT,
});


