import { DBService } from '../database';
import { TOKEN } from '../operations/interfaces';
import { ethMethodsBUSD, ethMethodsLINK } from '../../blockchain/eth';
import { createError } from '../../utils';

export interface IOperationService {
  database: DBService;
}

interface IMintParams {
  amount: number;
  token: TOKEN;
  address: string;
}

export class MintTokens {
  private database: DBService;
  private dbCollectionName = 'mint_tokens';

  private limits: Record<string, number> = {};

  constructor(params: IOperationService) {
    this.database = params.database;
  }

  mint = async (params: IMintParams) => {
    const limitKey = params.address + params.token;
    const lastMintDiff = Date.now() - this.limits[limitKey];

    if (lastMintDiff < 1000 * 60 * 60) {
      throw createError(
        400,
        `The mint ${params.token} tokens limit is exceeded for your address, left min: ` +
          String(60 - lastMintDiff / (1000 * 60))
      );
    }

    let res = { status: false, transactionHash: '' };

    try {
      switch (params.token) {
        case TOKEN.BUSD:
          res = await ethMethodsBUSD.mintToken(params.address, params.amount);
          break;

        case TOKEN.LINK:
          res = await ethMethodsLINK.mintToken(params.address, params.amount);
          break;

        default:
          throw createError(400, 'Token not found');
      }

      if (res.status) {
        this.limits[limitKey] = Date.now();
      }

      return { status: res.status ? 'success' : 'error', transactionHash: res.transactionHash };
    } catch (e) {
      return { status: 'error', transactionHash: res.transactionHash, error: e.message };
    }
  };
}
