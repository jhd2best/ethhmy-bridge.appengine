import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';
import { TransactionReceipt } from 'web3-core';
import { EthManager } from './EthManager';
import Web3 from 'web3';
import { EventsConstructor } from '../helpers/EventsConstructor';

export interface IEthMethodsInitParams {
  web3: Web3;
  ethManager: EthManager;
  ethToken: EthManager;
}

export class EthMethods extends EventsConstructor {
  web3: Web3;
  ethManager: EthManager;
  ethToken: EthManager;

  constructor(params: IEthMethodsInitParams) {
    super();

    this.web3 = params.web3;
    this.ethManager = params.ethManager;
    this.ethToken = params.ethToken;

    this.ethManager.wsContract.events
      .Locked()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.ethManager.wsContract.events
      .Unlocked()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);
  }

  // getTransactionByHash = async (transactionHash: string) => {
  //   return await web3.eth.getTransaction(transactionHash);
  // };

  getTransactionReceipt = async (transactionHash: string) => {
    const res = await this.web3.eth.getTransactionReceipt(transactionHash);

    if (!res) {
      return res;
    }

    const txInfo = await this.web3.eth.getTransaction(transactionHash);

    return { ...txInfo, ...res };
  };

  decodeApprovalLog = (receipt: TransactionReceipt) => {
    return this.web3.eth.abi.decodeLog(
      [
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: true, name: 'spender', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' },
      ],
      receipt.logs[0].data,
      receipt.logs[0].topics.slice(1)
    );
  };

  decodeLockTokenLog = (receipt: TransactionReceipt) => {
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
      receipt.logs[1].data,
      receipt.logs[1].topics.slice(1)
    );
  };

  waitingBlockNumber = async (blockNumber, callbackMessage) => {
    {
      const expectedBlockNumber = blockNumber + BLOCK_TO_FINALITY;

      while (true) {
        const blockNumber = await this.web3.eth.getBlockNumber();
        if (blockNumber <= expectedBlockNumber) {
          callbackMessage(
            `Currently at block ${blockNumber}, waiting for block ${expectedBlockNumber} to be confirmed`
          );

          await sleep(AVG_BLOCK_TIME);
        } else {
          break;
        }
      }
      return { status: true };
    }
  };

  unlockToken = async (userAddr, amount, receiptId) => {
    console.log('before unlockToken: ', receiptId);

    let res = { status: false, transactionHash: '', error: '' };

    try {
      res = await this.ethManager.contract.methods
        .unlockToken(amount, userAddr, receiptId)
        .send({
          from: this.ethManager.account.address,
          gas: process.env.ETH_GAS_LIMIT,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
        })
        .on('hash', hash => (res.transactionHash = hash));
    } catch (e) {
      console.log('unlockToken error: ', e.message.slice(0, 100) + '...', res.transactionHash);

      res.error = e.message;
    }

    console.log('unlockToken status: ', res.status);

    if (!res.transactionHash) {
      return res;
    }

    const txInfoRes = await this.web3.eth.getTransaction(res.transactionHash);

    return { ...res, ...txInfoRes };
  };

  mintToken = async (accountAddr: string, amount: number, increaseSupply = false) => {
    if (!this.web3.utils.isAddress(accountAddr)) {
      throw new Error('Invalid account address');
    }

    let res;

    if (increaseSupply) {
      res = await this.ethToken.contract.methods.increaseSupply(amount).send({
        from: this.ethToken.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
      });

      if (res.status !== true) {
        return res;
      }
    }

    res = await this.ethToken.contract.methods.transfer(accountAddr, amount).send({
      from: this.ethToken.account.address,
      gas: process.env.ETH_GAS_LIMIT,
      gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
    });

    return res;
  };
}
