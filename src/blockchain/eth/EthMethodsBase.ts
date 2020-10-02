import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep, withDecimals } from '../utils';
import { TransactionReceipt } from 'web3-core';
import { EthManager } from './EthManager';
import Web3 from 'web3';
import { EventsConstructor } from '../helpers/EventsConstructor';

export interface IEthMethodsInitParams {
  web3: Web3;
  ethManager: EthManager;
  ethToken: EthManager;
  ethMultiSigManager: EthManager;
}

export class EthMethodsBase extends EventsConstructor {
  web3: Web3;
  ethManager: EthManager;
  ethMultiSigManager: EthManager;
  ethToken: EthManager;

  constructor(params: IEthMethodsInitParams) {
    super();

    this.web3 = params.web3;
    this.ethManager = params.ethManager;
    this.ethMultiSigManager = params.ethMultiSigManager;
    this.ethToken = params.ethToken;

    this.ethManager.wsContract.events
      .Locked()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.ethManager.wsContract.events
      .Unlocked()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);

    this.ethMultiSigManager.wsContract.events
      .Submission()
      .on('data', async event => {
        const transaction = await this.ethMultiSigManager.contract.methods
          .transactions(event.returnValues.transactionId)
          .call();

        this.eventHandler({ ...event, transaction });
      })
      .on('error', this.eventErrorHandler);

    this.ethMultiSigManager.wsContract.events
      .Execution()
      .on('data', this.eventHandler)
      .on('error', this.eventErrorHandler);
  }

  isWSConnected = () => {
    return true;
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

  waitingBlockNumber = async (blockNumber, txHash, callbackMessage) => {
    {
      const tx = await this.web3.eth.getTransaction(txHash);
      if (!tx.blockNumber) {
        return {
          status: true,
          error: 'txHash no longer exists in the longest chain, possibly forked',
        };
      }

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

  mintToken = async (accountAddr: string, amount: number, increaseSupply = false) => {
    if (!this.web3.utils.isAddress(accountAddr)) {
      throw new Error('Invalid account address');
    }

    let res;

    if (increaseSupply) {
      res = await this.ethToken.contract.methods.increaseSupply(withDecimals(amount, 18)).send({
        from: this.ethToken.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
      });

      if (res.status !== true) {
        return res;
      }
    }

    res = await this.ethToken.contract.methods
      .transfer(accountAddr, withDecimals(amount, 18))
      .send({
        from: this.ethToken.account.address,
        gas: process.env.ETH_GAS_LIMIT,
        gasPrice: new BN(await this.web3.eth.getGasPrice()).mul(new BN(1)),
      });

    return res;
  };

  submitTxEth = async data => {
    const firstOwner = await this.ethMultiSigManager.contract.methods.owners(0).call();
    const validatorAddress = this.ethManager.account.address;

    if (firstOwner.toLowerCase() === validatorAddress.toLowerCase()) {
      // i am the first owner

      return await this.submitTx(data);
    } else {
      return new Promise((resolve, reject) => {
        this.subscribe({
          event: 'Submission',
          success: async event => {
            console.log('Submission', event);

            const res = await this.confirmTx(event.returnValues.transactionId);

            resolve(res);
          },
          failed: err => reject(err.error),
          condition: event => event.transaction.data === data,
        });
      });
    }
  };

  private submitTx = async data => {
    let res = { status: false, transactionHash: '', error: '' };

    try {
      res = await this.ethMultiSigManager.contract.methods
        .submitTransaction(this.ethManager.address, 0, data)
        .send({
          from: this.ethMultiSigManager.account.address,
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

  private confirmTx = async transactionId => {
    let res = { status: false, transactionHash: '', error: '' };

    try {
      res = await this.ethMultiSigManager.contract.methods
        .confirmTransaction(transactionId)
        .send({
          from: this.ethMultiSigManager.account.address,
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
}
