import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';
import { HmyMethodsBase } from './HmyMethodsBase';
import { encodeMintToken } from './hmy-encoders';

interface IHmyMethodsInitParams {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethods extends HmyMethodsBase {
  constructor(params: IHmyMethodsInitParams) {
    super(params);
  }

  mintToken = async (userAddr, amount, receiptId) => {
    console.log('before MultiSig mintToken: ', receiptId);

    const data = encodeMintToken(amount, userAddr, receiptId);
    return await this.submitTxHmy(data);
  };
}
