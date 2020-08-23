import { DBService } from './database';
import { BUSDService } from './busd';

export interface IServices {
  busd: BUSDService;
  database: DBService;
}

export const InitServices = async (): Promise<IServices> => {
  const database = new DBService();

  const busd = new BUSDService({ database });

  return {
    busd,
    database,
  };
};
