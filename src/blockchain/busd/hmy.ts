import { hmyManager, hmy } from '../hmySdk';
import { TransactionReceipt } from 'web3-core';

const options = { gasPrice: 1000000000, gasLimit: 6721900 };

export async function mintToken(userAddr, amount, receiptId) {
  const res = await hmyManager.contract.methods.mintToken(amount, userAddr, receiptId).send(options);

  return {
    ...res.transaction,
    status: res.status === 'called',
    transactionHash: res.transaction.id,
  };
}

export function decodeApprovalLog(receipt: TransactionReceipt) {
  let busdContract = hmy.contracts.createContract(
    require('../../contracts/BUSDImplementation.json').abi,
    process.env.HMY_BUSD_CONTRACT
  );
  return busdContract.abiCoder.decodeLog(
    busdContract.abiModel.getEvent('Approval').inputs,
    receipt.logs[0].data,
    receipt.logs[0].topics.slice(1)
  );
}

export function decodeBurnTokenLog(receipt: TransactionReceipt) {
  return hmyManager.contract.abiCoder.decodeLog(
    hmyManager.contract.abiModel.getEvent('Burned').inputs,
    receipt.logs[3].data,
    receipt.logs[3].topics.slice(1)
  );
}

export async function getTransactionReceipt(txnHash) {
  const res = await hmy.blockchain.getTransactionReceipt({ txnHash });

  if (!res.result) {
    return res.result;
  }

  return { ...res.result, status: res.result.status === '0x1' };
}
