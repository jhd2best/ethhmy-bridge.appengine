// import { hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethods {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({ hmySdk, hmyTokenContract, hmyManager, options }: IHmyMethodsInitParams) {
    this.hmySdk = hmySdk;
    this.hmyTokenContract = hmyTokenContract;
    this.hmyManager = hmyManager;

    if (options) {
      this.options = options;
    }
  }

  mintToken = async (userAddr, amount, receiptId) => {
    const res = await this.hmyManager.contract.methods
      .mintToken(amount, userAddr, receiptId)
      .send(this.options);

    return {
      ...res.transaction,
      status: res.status === 'called',
      transactionHash: res.transaction.id,
    };
  };

  decodeApprovalLog = (receipt: TransactionReceipt) => {
    return this.hmyTokenContract.abiCoder.decodeLog(
      this.hmyTokenContract.abiModel.getEvent('Approval').inputs,
      receipt.logs[0].data,
      receipt.logs[0].topics.slice(1)
    );
  };

  decodeBurnTokenLog = (receipt: TransactionReceipt) => {
    const receiptLogs = receipt.logs[3] || receipt.logs.slice(-1)[0];

    return this.hmyManager.contract.abiCoder.decodeLog(
      this.hmyManager.contract.abiModel.getEvent('Burned').inputs,
      receiptLogs.data,
      receiptLogs.topics.slice(1)
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
