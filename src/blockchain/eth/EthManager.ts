import { web3, web3WS } from './index';
import { readFileSync } from 'fs';
import { awsKMS } from '../utils';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import readlineSync from 'readline-sync';

const encryptedDir = './encrypted/' + readlineSync.question('Encrypted sub-dir (1-3): ');

export class EthManager {
  contract: Contract;
  wsContract: Contract;
  account: Account;
  address: string;
  constructor(contractJson, contractAddr) {
    this.contract = new web3.eth.Contract(contractJson.abi, contractAddr);
    this.wsContract = new web3WS.eth.Contract(contractJson.abi, contractAddr);
    this.address = contractAddr;

    awsKMS.decrypt(
      {
        CiphertextBlob: readFileSync(`${encryptedDir}/eth-secret`),
      },
      (err, data) => {
        if (!err) {
          const decryptedScret = data['Plaintext'].toString();
          this.call(decryptedScret);
        }
      }
    );
  }
  public call = (secret: string) => {
    this.account = web3.eth.accounts.privateKeyToAccount(secret);
    web3.eth.accounts.wallet.add(this.account);
  };
}
