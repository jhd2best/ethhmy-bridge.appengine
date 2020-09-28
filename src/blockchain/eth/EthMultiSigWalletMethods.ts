import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';
import { TransactionReceipt } from 'web3-core';
import { EthManager } from './EthManager';
import Web3 from 'web3';
import { EventsConstructor } from '../helpers/EventsConstructor';
import { ethWSProvider } from './index';

export interface IEthMethodsInitParams {
  web3: Web3;
  ethManager: EthManager;
}

export class EthMultiSigWalletMethods extends EventsConstructor {
  web3: Web3;
  ethManager: EthManager;

  constructor(params: IEthMethodsInitParams) {
    super();

    this.web3 = params.web3;
    this.ethManager = params.ethManager;

    this.ethManager.wsContract.events
      .Submission()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);
  }

  isWSConnected = () => {
    return ethWSProvider.connected;
  };

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

  encodeFunctionCall = (functionName, amount, recipient, receiptId) => {
    return this.web3.eth.abi.encodeFunctionCall(
      {
        constant: false,
        inputs: [
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'receiptId',
            type: 'bytes32',
          },
        ],
        name: functionName,
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      [amount, recipient, receiptId]
    );
  };

  // desination is the eth manager contract address, it can be BUSD, LINK, or ERC20 manager
  // value is the eth value, e.g., 0
  // data is the contract method signature with inputs to execute
  submitTx = async (destination, value, data) => {
    let res = { status: false, transactionHash: '', error: '' };

    try {
      res = await this.ethManager.contract.methods
        .submitTransaction(destination, value, data)
        .send({
          from: this.ethManager.account.address,
          gas: process.env.ETH_GAS_LIMIT,
          gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
        })
        .on('hash', hash => (res.transactionHash = hash));
    } catch (e) {
      console.log('submitTxEth error: ', e.message.slice(0, 100) + '...', res.transactionHash);

      res.error = e.message;
    }

    console.log('submitTxEth status: ', res.status);

    if (!res.transactionHash) {
      return res;
    }

    const txInfoRes = await this.web3.eth.getTransaction(res.transactionHash);

    return { ...res, ...txInfoRes };
  };

  // desination is the eth manager contract address, it can be BUSD, LINK, or ERC20 manager
  // value is the eth value, e.g., 0
  // data is the contract method signature with inputs to execute
  submitTxEth = async (destination, value, functionName, amount, recipient, receiptId) => {
    let res = { status: false, transactionHash: '', error: '' };
    let data = this.encodeFunctionCall(functionName, amount, recipient, receiptId);
    try {
      // for now, first owner submits transaction and other confirm
      // this logic can be changed later to an efficient logic
      let firstOwner = await this.ethManager.contract.methods.owners(0).call();
      if (firstOwner == this.ethManager.account.address) {
        // i am the first owner
        return this.submitTx(destination, value, data);
      }

      let res;
      let resEvent;
      let eventName = 'Submission';

      const confirmTx = async transactionId => {
        res = await this.ethManager.contract.methods
          .confirmTransaction(transactionId)
          .send({
            from: this.ethManager.account.address,
            gas: process.env.ETH_GAS_LIMIT,
            gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
          })
          .on('hash', hash => (res.transactionHash = hash));
      };

      const returnResult = () => {
        if (res && res.status !== true) {
          console.log('Action rejected: ', eventName);
        }

        // const isWsConnected = events.isWSConnected();
        // console.log('isWsConnected: ', isWsConnected);
        // const hasEvent = !isWsConnected || resEvent;
        const hasEvent = true;

        if (res && res.status === true && hasEvent) {
          console.log('Action success: ', eventName);
          confirmTx(resEvent.returnValues.transactionId);
        }
      };

      this.subscribe({
        event: eventName,
        success: event => {
          resEvent = event;
          returnResult();
        },
        failed: err => (res.error = err.error),
        condition: event => {
          this.ethManager.contract.methods
            .transactions(event.returnValues.transactionId)
            .call()
            .then(tx => {
              return tx.data === data;
            });
          return false; // TODO async this.
        },
      });
    } catch (e) {
      console.log('submitTxEth error: ', e.message.slice(0, 100) + '...', res.transactionHash);

      res.error = e.message;
    }

    console.log('submitTxEth status: ', res.status);

    if (!res.transactionHash) {
      return res;
    }

    const txInfoRes = await this.web3.eth.getTransaction(res.transactionHash);

    return { ...res, ...txInfoRes };
  };
}
