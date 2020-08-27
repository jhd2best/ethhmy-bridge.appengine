import { Harmony } from '@harmony-js/core';
import { ChainID, ChainType } from '@harmony-js/utils';
import { readFileSync } from 'fs';
import { awsKMS } from './utils';
import { Contract } from '@harmony-js/contract';

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

export class HmyManager {
  contract: Contract;
  constructor() {
    this.contract = hmy.contracts.createContract(
      hmyManagerJson.abi,
      process.env.HMY_MANAGER_CONTRACT
    );
  }

  public call = (secret: string) => {
    this.contract.wallet.addByPrivateKey(secret);
  };
}

export const hmyManager = new HmyManager();

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
})(hmyManager.call);
