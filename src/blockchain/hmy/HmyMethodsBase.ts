// import { hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';
import { EventsConstructor } from '../helpers/EventsConstructor';
import { hmyWSProvider } from './index';

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethodsBase extends EventsConstructor {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({
    hmySdk,
    hmyTokenContract,
    hmyManager,
    options,
    hmyManagerMultiSig,
  }: IHmyMethodsInitParams) {
    super();

    this.hmySdk = hmySdk;
    this.hmyTokenContract = hmyTokenContract;
    this.hmyManager = hmyManager;
    this.hmyManagerMultiSig = hmyManagerMultiSig;

    if (options) {
      this.options = options;
    }

    this.hmyManager.wsContract.events
      .Minted()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.hmyManager.wsContract.events
      .Burned()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.hmyManagerMultiSig.wsContract.events
      .Submission()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.hmyManagerMultiSig.wsContract.events
      .Execution()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);
  }

  isWSConnected = () => {
    return hmyWSProvider.connected;
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

  private submitTx = async data => {
    let res = { status: 'rejected', transactionHash: '', error: '', transaction: null };
    try {
      res = await this.hmyManagerMultiSig.contract.methods
        .submitTransaction(this.hmyManager.address, 0, data)
        .send(this.options)
        .on('hash', hash => {
          res.transactionHash = hash;
        });
    } catch (e) {
      console.log('submitTxHmy error: ', e);

      res.error = e.message;
    }

    console.log('submitTxHmy status: ', res.status);

    return {
      ...res.transaction,
      status: res.status === 'called',
      transactionHash: res.transaction.id,
    };
  };

  private confirmTx = async transactionId => {
    let res = { status: 'rejected', transactionHash: '', error: '', transaction: null };

    try {
      res = await this.hmyManagerMultiSig.contract.methods
        .confirmTransaction(transactionId)
        .send(this.options)
        .on('hash', hash => {
          res.transactionHash = hash;
        });
    } catch (e) {
      console.log('confirmTx error: ', e);

      res.error = e.message;
    }

    console.log('confirmTx status: ', res.status);

    return {
      ...res.transaction,
      status: res.status === 'called',
      transactionHash: res.transaction.id,
    };
  };

  submitTxHmy = async data => {
    const firstOwner = await this.hmyManagerMultiSig.contract.methods.owners(0).call(this.options);
    const validatorAddress = this.hmyManager.contract.wallet.accounts[0];
    console.log('firstOwner: ', firstOwner);
    console.log('validatorAddress: ', validatorAddress);

    if (firstOwner.toLowerCase() === validatorAddress.toLowerCase()) {
      // i am the first owner

      return await this.submitTx(data);
    } else {
      return new Promise((resolve, reject) => {
        this.subscribe({
          event: 'Submission',
          success: async event => {
            console.log('Submission', event);

            const res = await this.confirmTx(event.returnValues.transactionId);

            resolve(res);
          },
          failed: err => reject(err.error),
          condition: () => true,
          // condition: event => {
          //   this.ethManager.contract.methods
          //     .transactions(event.returnValues.transactionId)
          //     .call()
          //     .then(tx => {
          //       return tx.data === data;
          //     });
          //   return false; // TODO async this.
          // },
        });
      });
    }
  };
}
