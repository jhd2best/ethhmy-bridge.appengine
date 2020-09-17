// import { hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyTokenManager: HmyManager;
  hmyManager: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethods {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyTokenManager: HmyManager;
  hmyManager: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({
    hmySdk,
    hmyTokenManager,
    hmyTokenContract,
    hmyManager,
    options,
  }: IHmyMethodsInitParams) {
    this.hmySdk = hmySdk;
    this.hmyTokenManager = hmyTokenManager;
    this.hmyTokenContract = hmyTokenContract;
    this.hmyManager = hmyManager;

    if (options) {
      this.options = options;
    }
  }

  mintToken = async (oneTokenAddr, userAddr, amount, receiptId) => {
    console.log(3, oneTokenAddr, userAddr, amount, receiptId);

    const res = await this.hmyManager.contract.methods
      .mintToken(oneTokenAddr, amount, userAddr, receiptId)
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

  getMappingFor = async erc20TokenAddr => {
    const res = await this.hmyManager.contract.methods.mappings(erc20TokenAddr).call(this.options);

    return res;
  };

  addToken = async (erc20TokenAddr, name, symbol, decimals) => {
    const res = await this.hmyManager.contract.methods
      .addToken(process.env.TOKEN_MANAGER_CONTRACT, erc20TokenAddr, name, symbol, decimals)
      .send(this.options);

    return res;
  };
}
