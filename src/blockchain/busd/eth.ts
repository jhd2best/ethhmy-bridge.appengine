import { ethBUSDContract, managerContract, web3 } from '../ethSdk';
import BN from 'bn.js';
import { AVG_BLOCK_TIME, BLOCK_TO_FINALITY, sleep } from '../utils';

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

export async function sendSignedTransaction(rawTransaction: string) {
  return await web3.eth.sendSignedTransaction(rawTransaction);
}

// export async function approveEthManger(amount) {
//   const account = addAccount('0x694f76fae42a33b853054e950699de8e552e2e6b5bb7178404c73095c648da21');
//
//   return await ethBUSDContract.methods.approve(process.env.ETH_MANAGER_CONTRACT, amount).send({
//     from: account.address,
//     gas: process.env.ETH_GAS_LIMIT,
//     gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
//   });
// }
//
// export async function lockToken(userAddr, amount) {
//   const account = addAccount('0x694f76fae42a33b853054e950699de8e552e2e6b5bb7178404c73095c648da21');
//
//   const transaction = await managerContract.methods.lockToken(amount, userAddr).send({
//     from: account.address,
//     gas: process.env.ETH_GAS_LIMIT,
//     gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
//   });
//
//   return { ...transaction.events.Locked, status: transaction.status };
// }

export async function unlockToken(userAddr, amount, receiptId) {
  const ethMasterAccount = addAccount(process.env.ETH_MASTER_PRIVATE_KEY);

  return await managerContract.methods.unlockToken(amount, userAddr, receiptId).send({
    from: ethMasterAccount.address,
    gas: process.env.ETH_GAS_LIMIT,
    gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)), //new BN(process.env.ETH_GAS_PRICE)
  });
}

export async function waitingBlockNumber({ blockNumber }, callbackMessage) {
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
