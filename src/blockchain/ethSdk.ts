import Web3 from 'web3';
import { awsKMS } from './utils';
import { readFileSync } from 'fs';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';

export const web3URL = process.env.ETH_NODE_URL;

export const web3 = new Web3(web3URL);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethBUSDJson = require('../contracts/BUSDImplementation.json');
const ethBUSDJsonAbi: any = ethBUSDJson.abi;

export const ethBUSDContract = new web3.eth.Contract(ethBUSDJsonAbi, process.env.ETH_BUSD_CONTRACT);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethManagerJson = require('../contracts/BUSDEthManager.json');
const ethManagerJsonAbi: any = ethManagerJson.abi;

export class EthManager {
  contract: Contract;
  account: Account;
  constructor() {
    this.contract = new web3.eth.Contract(ethManagerJsonAbi, process.env.ETH_MANAGER_CONTRACT);
  }
  public call = (secret: string) => {
    this.account = web3.eth.accounts.privateKeyToAccount(secret);
    web3.eth.accounts.wallet.add(this.account);
  };
}

export const ethManager = new EthManager();

((callback: (string) => void) => {
  awsKMS.decrypt(
    {
      CiphertextBlob: readFileSync('./encrypted/eth-secret'),
    },
    function (err, data) {
      if (!err) {
        const decryptedScret = data['Plaintext'].toString();
        callback(decryptedScret);
      }
    }
  );
})(ethManager.call);
