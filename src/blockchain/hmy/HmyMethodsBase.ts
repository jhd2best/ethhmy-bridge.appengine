import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';
import { EventsConstructor } from '../helpers/EventsConstructor';
import { hmyWSProvider } from './index';
import { HmyEventsTracker } from './HmyEventsTracker';
import logger from '../../logger';
const log = logger.module('validator:hmyMethodsBase');

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
  hmyEventsTracker: HmyEventsTracker;
}

export class HmyMethodsBase extends EventsConstructor {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  hmyEventsTracker: HmyEventsTracker;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({
    hmySdk,
    hmyTokenContract,
    hmyManager,
    options,
    hmyManagerMultiSig,
    hmyEventsTracker,
  }: IHmyMethodsInitParams) {
    super();

    this.hmySdk = hmySdk;
    this.hmyTokenContract = hmyTokenContract;
    this.hmyManager = hmyManager;
    this.hmyManagerMultiSig = hmyManagerMultiSig;

    if (options) {
      this.options = options;
    }

    this.hmyEventsTracker = hmyEventsTracker;

    // subscribe current manager to Submission events
    this.hmyEventsTracker.addTrack('Minted', this.hmyManager, this.eventHandler);
    this.hmyEventsTracker.onEventHandler(this.eventHandler);
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

  submitTx = async data => {
    let res = { status: 'rejected', transactionHash: '', error: '', transaction: null, events: {} };
    try {
      res = await this.hmyManagerMultiSig.contract.methods
        .submitTransaction(this.hmyManager.address, 0, data)
        .send(this.options)
        .on('hash', hash => {
          res.transactionHash = hash;
        });
    } catch (e) {
      log.error('submitTxHmy error: ', { error: e, res, data, address: this.hmyManager.address });

      res.error = e.message;
    }

    console.log('submitTxHmy status: ', res.status);

    return {
      ...res.transaction,
      status: res.status === 'called',
      transactionHash: res.transaction && res.transaction.id,
    };
  };

  confirmTx = async transactionId => {
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

    // console.log('confirmTx status: ', res.status);

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
            console.log('Submission', event.returnValues.transactionId);

            const res = await this.confirmTx(event.returnValues.transactionId);

            resolve(res);
          },
          failed: err => reject(err.error),
          condition: event => event.transaction.data === data,
        });
      });
    }
  };
}
