import { DBService } from './database';
import { OperationService } from './operations';
import { MintTokens } from './mintTokens';

export interface IServices {
  operations: OperationService;
  mintTokens: MintTokens;
  database: DBService;
}

export const InitServices = async (): Promise<IServices> => {
  const database = new DBService();

  const operations = new OperationService({ database });
  const mintTokens = new MintTokens({ database });

  return {
    operations,
    database,
    mintTokens,
  };
};
