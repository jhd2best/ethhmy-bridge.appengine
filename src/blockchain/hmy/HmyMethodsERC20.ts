import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { HmyManager } from './HmyManager';
import { HmyMethodsBase } from './HmyMethodsBase';
import { encodeMintTokenErc20 } from './hmy-encoders';

export class HmyMethodsERC20 extends HmyMethodsBase {
  hmySdk: Harmony;
  hmyTokenContract: Contract;
  hmyManager: HmyManager;
  hmyManagerMultiSig: HmyManager;
  options = { gasPrice: 1000000000, gasLimit: 6721900 };

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

  mintToken = async (oneTokenAddr, userAddr, amount, receiptId) => {
    // console.log('before MultiSig mintToken: ', receiptId);

    const data = encodeMintTokenErc20(oneTokenAddr, amount, userAddr, receiptId);
    return await this.submitTxHmy(data);
  };
}
