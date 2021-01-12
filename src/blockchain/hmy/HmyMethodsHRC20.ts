import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyMethodsBase } from './HmyMethodsBase';
import logger from '../../logger';
const log = logger.module('validator:hmyMethodsHRC20');
import hmyManagerHRC20Json = require('../contracts/HmyManagerHRC20.json');
import { TransactionReceipt } from 'web3-core';
import { encodeUnlockTokenHrc20, encodeUnlockOne } from './hmy-encoders';
import erc20Json = require('../contracts/MyERC20.json');

export class HmyMethodsHRC20 extends HmyMethodsBase {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor(params) {
    super({ ...params, hmyManagerJson: hmyManagerHRC20Json, disableDefaultEvents: true });

    // subscribe current manager to Submission events
    this.hmyEventsTracker.addTrack('Unlocked', this.hmyManager, this.eventHandler);
    this.hmyEventsTracker.onEventHandler(this.eventHandler);
  }

  decodeApprovalLog = (receipt: TransactionReceipt) => {
    return this.hmyTokenContract.abiCoder.decodeLog(
      this.hmyTokenContract.abiModel.getEvent('Approval').inputs,
      receipt.logs[0].data,
      receipt.logs[0].topics.slice(1)
    );
  };

  decodeLockTokenLog = (receipt: TransactionReceipt) => {
    const receiptLogs = receipt.logs[3] || receipt.logs.slice(-1)[0];

    return this.hmyManager.contract.abiCoder.decodeLog(
      this.hmyManager.contract.abiModel.getEvent('Locked').inputs,
      receiptLogs.data,
      receiptLogs.topics.slice(1)
    );
  };

  unlockToken = async (erc20Address, userAddr, amount, receiptId) => {
    console.log('before unlockToken: ', receiptId);

    const data = encodeUnlockTokenHrc20(erc20Address, amount, userAddr, receiptId);
    return await this.submitTxHmy(data);
  };

  unlockTokenOne = async (userAddr, amount, receiptId) => {
    console.log('before unlockTokenOne: ', receiptId);

    const data = encodeUnlockOne(amount, userAddr, receiptId);
    return await this.submitTxHmy(data);
  };

  tokenDetails = async contract => {
    const hrc20Contract = this.hmySdk.contracts.createContract(erc20Json.abi as any, contract);

    return [
      await hrc20Contract.methods.name().call(),
      await hrc20Contract.methods.symbol().call(),
      await hrc20Contract.methods.decimals().call(),
    ];
  };
}
