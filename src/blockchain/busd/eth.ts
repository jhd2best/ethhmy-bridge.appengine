import { managerContract, web3 } from '../ethSdk';
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
