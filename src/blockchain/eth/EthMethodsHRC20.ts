import BN from 'bn.js';
import { EthMethodsBase, IEthMethodsInitParams } from './EthMethodsBase';
import { encodeMintTokenHrc20 } from './eth-encoders';
import erc20Json = require('../contracts/MyERC20.json');
import { TransactionReceipt } from 'web3-core';
import { sleep } from '../utils';

export class EthMethodsHRC20 extends EthMethodsBase {
  constructor(params: IEthMethodsInitParams) {
    super({ ...params, disableDefaultEvents: true });

    // subscribe current manager to Submission events
    this.ethEventsTracker.addTrack(
      'Minted',
      this.ethManager.contract,
      this.eventHandler,
      () => !!Object.keys(this.subscribers).length
    );
    this.ethEventsTracker.onEventHandler(this.eventHandler);
  }

  getMappingFor = async hrc20TokenAddr => {
    const res = await this.ethManager.contract.methods.mappings(hrc20TokenAddr).call();

    return res;
  };

  addToken = async (hrc20TokenAddr, name, symbol, decimals) => {
    const firstOwner = await this.ethMultiSigManager.contract.methods.owners(0).call();
    const validatorAddress = this.ethManager.account.address;

    if (firstOwner.toLowerCase() === validatorAddress.toLowerCase()) {
      // i am the first owner
      const res = await this.ethManager.contract.methods
        .addToken(process.env.ETH_TOKEN_MANAGER_CONTRACT, hrc20TokenAddr, name, symbol, decimals)
        .send({
          from: this.ethManager.account.address,
          gas: 4712388,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
        });

      return res;
    }

    return {};
  };

  mintERC20Token = async (oneTokenAddr, userAddr, amount, receiptId) => {
    // console.log('before MultiSig mintToken: ', receiptId);

    const data = encodeMintTokenHrc20(oneTokenAddr, amount, userAddr, receiptId);
    return await this.submitTxEth(data);
  };

  totalSupply = async erc20Address => {
    let ethTokenContract, res;

    try {
      ethTokenContract = new this.web3.eth.Contract(erc20Json.abi as any, erc20Address);
    } catch (e) {
      await sleep(5000);

      return 0;
    }

    try {
      res = await ethTokenContract.methods.totalSupply().call();
    } catch (e) {
      await sleep(5000);

      return 0;
    }

    return res;
  };

  decodeBurnTokenLog = (receipt: TransactionReceipt) => {
    return this.web3.eth.abi.decodeLog(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
      ],
      receipt.logs[2].data,
      receipt.logs[2].topics.slice(1)
    );
  };

  tokenDetails = async contract => {
    const erc20Contract = new this.web3.eth.Contract(erc20Json.abi as any, contract);
    return [
      await erc20Contract.methods.name().call(),
      await erc20Contract.methods.symbol().call(),
      await erc20Contract.methods.decimals().call(),
    ];
  };
}
