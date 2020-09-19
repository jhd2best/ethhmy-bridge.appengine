import { hmy, hmyWS } from './index';
import { Contract } from '@harmony-js/contract';
import { readFileSync } from 'fs';
import { awsKMS } from '../utils';

export class HmyManager {
  contract: Contract;
  wsContract: Contract;
  address: string;
  constructor(contractJson, contractAddr) {
    this.contract = hmy.contracts.createContract(contractJson.abi, contractAddr);
    this.wsContract = hmyWS.contracts.createContract(contractJson.abi, contractAddr);
    this.address = contractAddr;

    awsKMS.decrypt(
      {
        CiphertextBlob: readFileSync('./encrypted/hmy-secret'),
      },
      (err, data) => {
        if (!err) {
          const decryptedScret = data['Plaintext'].toString();
          this.call(decryptedScret);
        }
      }
    );
  }

  call = (secret: string) => {
    this.contract.wallet.addByPrivateKey(secret);
  };
}
