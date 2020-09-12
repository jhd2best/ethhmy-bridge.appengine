import { hmy } from '../../blockchain/hmy';
import { web3 } from '../../blockchain/eth';
import { createError } from '../../routes/helpers';

export const validateOneBalanceNonZero = async address => {
  const res = await hmy.blockchain.getBalance({ address });

  if (Number(res.result) === 0) {
    throw createError(500, 'User one balance is to low');
  }
};

export const validateEthBalanceNonZero = ethAddress => {
  return new Promise(resolve => {
    web3.eth.getBalance(ethAddress, (err, balance) => {
      if (err) {
        throw createError(500, 'Error to get eth balance');
      }

      if (!Number(balance)) {
        throw createError(500, 'User eth balance is to low');
      }

      resolve(Number(balance));
    });
  });
};
