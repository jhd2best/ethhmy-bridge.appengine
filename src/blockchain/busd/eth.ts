import { ethManagerBUSD, ethManagerLINK, web3 } from '../ethSdk';
import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';
import { TransactionReceipt } from 'web3-core';
import { EthManager } from '../ethSdk';
import Web3 from 'web3';

export interface IEthMethodsInitParams {
  web3: Web3;
  ethManager: EthManager;
}

export class EthMethods {
  web3: Web3;
  ethManager: EthManager;

  constructor(params: IEthMethodsInitParams) {
    this.web3 = params.web3;
    this.ethManager = params.ethManager;
  }

  // getTransactionByHash = async (transactionHash: string) => {
  //   return await web3.eth.getTransaction(transactionHash);
  // };

  getTransactionReceipt = async (transactionHash: string) => {
    return await this.web3.eth.getTransactionReceipt(transactionHash);
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
    const res = await this.ethManager.contract.methods
      .unlockToken(amount, userAddr, receiptId)
      .send({
        from: this.ethManager.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
      });

    return res;
  };
}

export const ethMethodsBUSD = new EthMethods({ web3, ethManager: ethManagerBUSD });
export const ethMethodsLINK = new EthMethods({ web3, ethManager: ethManagerLINK });
