import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import hmyManagerJson = require('../contracts/BUSDHmyManager.json');

export const hmyManagerContract = hmy.contracts.createContract(
  hmyManagerJson.abi,
  process.env.HMY_MANAGER_CONTRACT
);

// hmyManagerContract.wallet.setSigner(process.env.HMY_ADMIN_ADDRESS);
hmyManagerContract.wallet.addByPrivateKey(process.env.HMY_ADMIN_PRIVATE_KEY);
