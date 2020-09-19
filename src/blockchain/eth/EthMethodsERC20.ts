import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';
import { TransactionReceipt } from 'web3-core';
import { EthManager } from './EthManager';
import Web3 from 'web3';
import erc20Json = require('../contracts/MyERC20.json');
import { EventsConstructor } from '../helpers/EventsConstructor';

export interface IEthMethodsERC20InitParams {
  web3: Web3;
  ethManager: EthManager;
}

export class EthMethodsERC20 extends EventsConstructor {
  web3: Web3;
  ethManager: EthManager;

  constructor(params: IEthMethodsERC20InitParams) {
    super();

    this.web3 = params.web3;
    this.ethManager = params.ethManager;

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
      receipt.logs[2].data,
      receipt.logs[2].topics.slice(1)
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

  unlockToken = async (erc20Address, userAddr, amount, receiptId) => {
    const res = await this.ethManager.contract.methods
      .unlockToken(erc20Address, amount, userAddr, receiptId)
      .send({
        from: this.ethManager.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
      });

    if (!res.transactionHash) {
      return res;
    }

    const txInfoRes = await this.web3.eth.getTransaction(res.transactionHash);

    return { ...res, ...txInfoRes };
  };

  tokenDetails = async contract => {
    const erc20Contract = new this.web3.eth.Contract(erc20Json.abi as any, contract);
    return [
      await erc20Contract.methods.name().call(),
      await erc20Contract.methods.symbol().call(),
      await erc20Contract.methods.decimals().call(),
    ];
  };

  lockTokenFor = async (erc20Address, ethAddress, amount, oneAddress) => {
    const transaction = await this.ethManager.contract.methods
      .lockTokenFor(erc20Address, ethAddress, amount, oneAddress)
      .send({
        from: this.ethManager.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
      });

    return { ...transaction.events.Locked, status: transaction.status };
  };
}
