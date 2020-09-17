import { DBService } from '../database';
import { ethMethods } from '../../blockchain/eth';
import { createError } from '../../utils';

export interface IOperationService {
  database: DBService;
}

interface IMintParams {
  amount: number;
  erc20Address: string;
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
    const limitKey = params.address + params.erc20Address;
    const lastMintDiff = Date.now() - this.limits[limitKey];

    if (lastMintDiff < 1000 * 60 * 60) {
      throw createError(
        400,
        `The limit for getting ${params.erc20Address} tokens is exceeded for your address, min's left: ` +
          Math.round(60 - lastMintDiff / (1000 * 60))
      );
    }

    const res = { status: false, transactionHash: '' };

    try {
      // res = await ethMethods.mintToken(params.address, params.amount);

      if (res.status) {
        this.limits[limitKey] = Date.now();
      }

      return { status: res.status ? 'success' : 'error', transactionHash: res.transactionHash };
    } catch (e) {
      return { status: 'error', transactionHash: res.transactionHash, error: e.message };
    }
  };
}
