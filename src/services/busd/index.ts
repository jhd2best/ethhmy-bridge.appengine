import { DBService } from '../database';
import { IOperationInitParams, Operation } from './Operation';

export interface IBUSDService {
  database: DBService;
}

export class BUSDService {
  database: DBService;

  operations: Operation[] = [];

  constructor(params: IBUSDService) {
    this.database = params.database;
  }

  create = (params: IOperationInitParams) => {
    const operation = new Operation(params);

    this.operations.push(operation);

    return operation.toObject();
  };

  getOperationById = (id: string) => {
    const operation = this.operations.find(operation => operation.id === id);

    if (operation) {
      return operation.toObject();
    }

    return null;
  };

  getAllOperations = (params: { ethAddress?: string; oneAddress?: string }) => {
    return this.operations
      .filter(operation => {
        const hasEthAddress = params.ethAddress ? params.ethAddress === operation.ethAddress : true;
        const hasOneAddress = params.oneAddress ? params.oneAddress === operation.oneAddress : true;

        return hasEthAddress && hasOneAddress;
      })
      .map(operation => operation.toObject());
  };
}
