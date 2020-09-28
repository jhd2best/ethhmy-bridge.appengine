// import { hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';
import { EventsConstructor } from '../helpers/EventsConstructor';
import { hmyWSProvider } from './index';

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyManager: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMultiSigWalletMethods extends EventsConstructor {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({ hmySdk, hmyManager, options }: IHmyMethodsInitParams) {
    super();

    this.hmySdk = hmySdk;
    this.hmyManager = hmyManager;

    if (options) {
      this.options = options;
    }

    this.hmyManager.wsContract.events
      .Submission()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);
  }

  isWSConnected = () => {
    return hmyWSProvider.connected;
  };

  mintToken = async (userAddr, amount, receiptId) => {
    console.log('before mintToken: ', receiptId);

    const res = await this.hmyManager.contract.methods
      .mintToken(amount, userAddr, receiptId)
      .send(this.options);

    console.log('mintToken status: ', res.status);

    return {
      ...res.transaction,
      status: res.status === 'called',
      transactionHash: res.transaction.id,
    };
  };

  encodeFunctionCall = (functionName, amount, recipient, receiptId) => {
    return this.hmyManager.contract.abiCoder.encodeFunctionCall(
      {
        constant: false,
        inputs: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'receiptId',
            type: 'bytes32',
          },
        ],
        name: functionName,
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      [amount, recipient, receiptId]
    );
  };

  getTransactionReceipt = async txnHash => {
    const res = await this.hmySdk.blockchain.getTransactionReceipt({ txnHash });

    if (!res.result) {
      return res.result;
    }

    const txInfoRes = await this.hmySdk.blockchain.getTransactionByHash({ txnHash });

    return { ...res.result, ...txInfoRes.result, status: res.result.status === '0x1' };
  };
}
