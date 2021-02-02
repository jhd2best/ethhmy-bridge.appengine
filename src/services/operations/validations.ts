import axios from 'axios';

import { hmy } from '../../blockchain/hmy';
import { web3, ethMethodsERC20 } from '../../blockchain/eth';
import { createError } from '../../routes/helpers';
import { TOKEN } from './interfaces';
import logger from '../../logger';

const log = logger.module('validator:OperationCreate');

export const validateOneBalanceNonZero = async address => {
  const res = await hmy.blockchain.getBalance({ address });

  if (Number(res.result) === 0) {
    throw createError(500, 'User one balance is to low');
  }
};

export const validateEthBalanceNonZero = ethAddress => {
  return new Promise((resolve, reject) => {
    web3.eth.getBalance(ethAddress, (err, balance) => {
      if (err) {
        return reject(false);
      }

      if (!Number(balance)) {
        return reject(false);
      }

      resolve(Number(balance));
    });
  });
};

export const getTokenPrice = async (tokenSymbol: string) => {
  let usdPrice = 0;

  try {
    const res = await axios.get<{ lastPrice: number }>(
      `https://api.binance.com/api/v1/ticker/24hr?symbol=${tokenSymbol}USDT`
    );

    usdPrice = res.data.lastPrice;
  } catch (e) {
    // log.error('get usdPrice api binance', { error: e, token });
  }

  if (!Number(usdPrice)) {
    try {
      const res = await axios.get<{ USD: number; USDT: number }>(
        `https://min-api.cryptocompare.com/data/price?fsym=${tokenSymbol}&tsyms=USDT&tsyms=USD`
      );

      usdPrice = res.data.USD || res.data.USDT;
    } catch (e) {
      log.error('get usdPrice cryptocompare', { error: e, tokenSymbol });
    }
  }

  return usdPrice;
};

export const getTokenUSDPrice = (token: TOKEN, erc20Address?: string) => {
  return new Promise(async (resolve, reject) => {
    let usdPrice = 0;

    switch (token) {
      case TOKEN.BUSD:
        try {
          usdPrice = await getTokenPrice('BUSD');
        } catch (e) {}
        break;

      case TOKEN.ONE:
        try {
          usdPrice = await getTokenPrice('ONE');
        } catch (e) {}
        break;

      case TOKEN.LINK:
        try {
          usdPrice = await getTokenPrice('LINK');
        } catch (e) {}
        break;

      case TOKEN.ERC20:
        if (erc20Address) {
          try {
            const [name, symbol, decimals] = await ethMethodsERC20.tokenDetails(erc20Address);
            if (symbol) {
              usdPrice = await getTokenPrice(symbol);
            }
          } catch (e) {}
        }
        break;
    }

    resolve(usdPrice);
  });
};
