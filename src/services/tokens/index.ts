import { DBService } from '../database';
import { hmyTokensTracker, hmyMethodsERC20 } from '../../blockchain/hmy';

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

const GET_TOTAL_LOCKED_INTERVAL = 30000;

export class Tokens {
  private database: DBService;
  private dbCollectionName = 'tokens';

  private tokens: ITokenInfo[] = [];

  private lastUpdateTime = Date.now();

  constructor(params: IOperationService) {
    this.database = params.database;

    setInterval(this.getTotalLocked, GET_TOTAL_LOCKED_INTERVAL);
  }

  getTotalLocked = async () => {
    const tokens = hmyTokensTracker.getTokens();

    this.tokens = await Promise.all(
      tokens.map(async token => {
        const totalSupply = await hmyMethodsERC20.totalSupply(token.hrc20Address);

        return { ...token, totalLocked: String(totalSupply) };
      })
    );

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
