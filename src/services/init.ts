import { DBService } from './database';
import { OperationService } from './operations';

export interface IServices {
  operations: OperationService;
  database: DBService;
}

export const InitServices = async (): Promise<IServices> => {
  const database = new DBService();

  const operations = new OperationService({ database });

  return {
    operations,
    database,
  };
};
