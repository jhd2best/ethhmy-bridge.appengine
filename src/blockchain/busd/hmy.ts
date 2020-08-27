// import { hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';
import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { hmy, hmyBUSDManager, hmyLINKManager, HmyManager } from '../hmySdk';

interface IHarmonyMehodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

class HarmonyMethods {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor({ hmySdk, hmyTokenContract, hmyManager, options }: IHarmonyMehodsInitParams) {
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
    return this.hmyManager.contract.abiCoder.decodeLog(
      this.hmyManager.contract.abiModel.getEvent('Burned').inputs,
      receipt.logs[3].data,
      receipt.logs[3].topics.slice(1)
    );
  };

  getTransactionReceipt = async txnHash => {
    const res = await this.hmySdk.blockchain.getTransactionReceipt({ txnHash });

    if (!res.result) {
      return res.result;
    }

    return { ...res.result, status: res.result.status === '0x1' };
  };
}

const busdContract = hmy.contracts.createContract(
  require('../../contracts/BUSDImplementation.json').abi,
  process.env.HMY_BUSD_CONTRACT
);

const linkContract = hmy.contracts.createContract(
  require('../../contracts/LinkToken.json').abi,
  process.env.HMY_BUSD_CONTRACT
);

export const hmyBUSDMethods = new HarmonyMethods({
  hmySdk: hmy,
  hmyTokenContract: busdContract,
  hmyManager: hmyBUSDManager,
});

export const hmyLINKMethods = new HarmonyMethods({
  hmySdk: hmy,
  hmyTokenContract: linkContract,
  hmyManager: hmyLINKManager,
});
