import Web3 from 'web3';
import { awsKMS } from './utils';
import { readFileSync } from 'fs';
import { Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';

export const web3URL = process.env.ETH_NODE_URL;

export const web3 = new Web3(web3URL);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethBUSDManagerJson = require('../contracts/BUSDEthManager.json');

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethLINKManagerJson = require('../contracts/LINKEthManager.json');

export class EthManager {
  contract: Contract;
  account: Account;
  address: string;
  constructor(contractJson, contractAddr) {
    this.contract = new web3.eth.Contract(contractJson.abi, contractAddr);
    this.address = contractAddr;
  }
  public call = (secret: string) => {
    this.account = web3.eth.accounts.privateKeyToAccount(secret);
    web3.eth.accounts.wallet.add(this.account);
  };
}

export const ethManagerBUSD = new EthManager(ethBUSDManagerJson, process.env.ETH_MANAGER_CONTRACT);

export const ethManagerLINK = new EthManager(
  ethLINKManagerJson,
  process.env.ETH_LINK_MANAGER_CONTRACT
);

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
})(ethManagerBUSD.call);

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
})(ethManagerLINK.call);
