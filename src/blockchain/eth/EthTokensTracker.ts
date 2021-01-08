import Web3 from 'web3';
import { EthEventsTracker } from './EthEventsTracker';
import { ITokenInfo } from '../hmy/HmyTokensTracker';
import { EthMethodsERC20 } from './EthMethodsERC20';
import { EthMethodsERC721 } from './EthMethodsERC721';
import logger from '../../logger';
const log = logger.module('validator:EthTokensTracker');

interface IEthEventTrackerParams {
  ethEventsTracker: EthEventsTracker;
  ethMethods: EthMethodsERC20 | EthMethodsERC721;
  web3: Web3;
}

export class EthTokensTracker {
  ethEventsTracker: EthEventsTracker;
  ethMethods: EthMethodsERC20 | EthMethodsERC721;
  tokens: ITokenInfo[] = [];

  constructor(params: IEthEventTrackerParams) {
    this.ethEventsTracker = params.ethEventsTracker;
    this.ethMethods = params.ethMethods;

    this.ethEventsTracker.onEventHandler(async event => {
      const token = event.returnValues;

      try {
        const [name, symbol, decimals] = await this.ethMethods.tokenDetails(token.tokenAck);

        this.tokens.push({
          hrc20Address: token.tokenReq,
          erc20Address: token.tokenAck,
          name,
          symbol,
          decimals,
        });
      } catch (e) {
        log.error('Error get token details', { error: e && e.message, params });
      }
    });
  }

  getTokens = () => {
    return this.tokens;
  };
}
