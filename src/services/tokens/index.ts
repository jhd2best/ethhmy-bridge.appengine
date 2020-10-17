import { DBService } from '../database';
import { hmyTokensTracker, hmyMethodsERC20, hmyMethodsLINK } from '../../blockchain/hmy';
import logger from '../../logger';
const log = logger.module('validator:tokensService');

export interface IOperationService {
  database: DBService;
}

export interface ITokenInfo {
  name: string;
  symbol: string;
  decimals: string;
  erc20Address: string;
  hrc20Address: string;
  totalLocked: string;
}

const GET_TOTAL_LOCKED_INTERVAL = 60000;

export class Tokens {
  private database: DBService;
  private dbCollectionName = 'tokens';

  private tokens: ITokenInfo[] = [];

  private lastUpdateTime = Date.now();

  constructor(params: IOperationService) {
    this.database = params.database;

    setInterval(this.getTotalLocked, GET_TOTAL_LOCKED_INTERVAL);

    this.getTotalLocked();
  }

  getTotalLocked = async () => {
    const tokens = hmyTokensTracker.getTokens();

    const newTokens = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let totalSupply = 0;

      try {
        if (token.erc20Address === process.env.ETH_LINK_CONTRACT) {
          const hmyLINKManagerBalance = await hmyMethodsLINK.getBalance(
            process.env.HMY_LINK_MANAGER_CONTRACT
          );

          const initMinted = 100000 * 1e18;

          totalSupply = initMinted - Number(hmyLINKManagerBalance);
        } else {
          totalSupply = await hmyMethodsERC20.totalSupply(token.hrc20Address);
        }
      } catch (e) {
        log.error('get totalSupply', { error: e, token });
        return;
      }

      newTokens.push({ ...token, totalLocked: String(totalSupply) });
    }

    this.tokens = newTokens;
    this.lastUpdateTime = Date.now();
  };

  getAllTokens = (params: { size: number; page: number }) => {
    const from = params.page * params.size;
    const to = (params.page + 1) * params.size;
    const paginationData = this.tokens.slice(from, Math.min(to, this.tokens.length));

    return {
      content: paginationData,
      totalElements: this.tokens.length,
      totalPages: Math.ceil(this.tokens.length / params.size),
      size: params.size,
      page: params.page,
      lastUpdateTime: this.lastUpdateTime,
    };
  };
}
