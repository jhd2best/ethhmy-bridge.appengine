import { hmyManagerContract, hmy } from '../hmySdk';

const options = { gasPrice: 1000000000, gasLimit: 6721900 };

export async function mintToken(userAddr, amount, receiptId) {
  const res = await hmyManagerContract.methods.mintToken(amount, userAddr, receiptId).send(options);

  return {
    ...res.transaction,
    status: res.status === 'called',
    transactionHash: res.transaction.id,
  };
}

export async function getTransactionReceipt(txnHash) {
  const res = await hmy.blockchain.getTransactionReceipt({ txnHash });

  console.log(res);

  return res;
}
