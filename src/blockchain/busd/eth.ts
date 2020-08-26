import { managerContract, web3 } from '../ethSdk';
import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';
import { TransactionReceipt } from 'web3-core';

const addAccount = (privateKey: string) => {
  const ethMasterAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(ethMasterAccount);

  return ethMasterAccount;
};

export async function getTransactionByHash(transactionHash: string) {
  return await web3.eth.getTransaction(transactionHash);
}

export async function getTransactionReceipt(transactionHash: string) {
  return await web3.eth.getTransactionReceipt(transactionHash);
}

export function decodeApprovalLog(receipt: TransactionReceipt) {
  return web3.eth.abi.decodeLog(
    [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'spender', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    receipt.logs[0].data,
    receipt.logs[0].topics.slice(1)
  );
}

export function decodeLockTokenLog(receipt: TransactionReceipt) {
  return web3.eth.abi.decodeLog(
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
}

export async function unlockToken(userAddr, amount, receiptId) {
  const ethMasterAccount = addAccount(process.env.ETH_MASTER_PRIVATE_KEY);

  return await managerContract.methods.unlockToken(amount, userAddr, receiptId).send({
    from: ethMasterAccount.address,
    gas: process.env.ETH_GAS_LIMIT,
    gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
  });
}

export async function waitingBlockNumber(blockNumber, callbackMessage) {
  {
    const expectedBlockNumber = blockNumber + BLOCK_TO_FINALITY;

    while (true) {
      const blockNumber = await web3.eth.getBlockNumber();
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
}
