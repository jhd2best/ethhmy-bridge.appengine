import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { readFileSync } from 'fs';
import { Contract } from '@harmony-js/contract';

import { awsKMS } from './utils';

export const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  'https://api.s0.b.hmny.io',
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import hmyBUSDManagerJson = require('../contracts/BUSDHmyManager.json');

// eslint-disable-next-line @typescript-eslint/no-var-requires
import hmyLINKManagerJson = require('../contracts/LinkToken.json');

export class HmyManager {
  contract: Contract;
  constructor(contractJson, contractAddr) {
    this.contract = hmy.contracts.createContract(contractJson.abi, contractAddr);
  }

  call = (secret: string) => {
    this.contract.wallet.addByPrivateKey(secret);
  };
}

export const hmyBUSDManager = new HmyManager(hmyBUSDManagerJson, process.env.HMY_MANAGER_CONTRACT);
export const hmyLINKManager = new HmyManager(
  hmyLINKManagerJson,
  process.env.HMY_LINK_MANAGER_CONTRACT
);

((callback: (string) => void) => {
  awsKMS.decrypt(
    {
      CiphertextBlob: readFileSync('./encrypted/hmy-secret'),
    },
    function (err, data) {
      if (!err) {
        const decryptedScret = data['Plaintext'].toString();
        callback(decryptedScret);
      }
    }
  );
})(hmyBUSDManager.call);
