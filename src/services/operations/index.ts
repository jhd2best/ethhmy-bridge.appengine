import { DBService } from '../database';
import { IOperationInitParams, Operation } from './Operation';
import { createError } from '../../routes/helpers';
import { STATUS } from './interfaces';

export interface IOperationService {
  database: DBService;
}

export class OperationService {
  database: DBService;

  operations: Operation[] = [];

  constructor(params: IOperationService) {
    this.database = params.database;
  }

  create = (params: IOperationInitParams) => {
    // if (
    //   this.operations.some(
    //     op => op.ethAddress === params.ethAddress && op.status === STATUS.IN_PROGRESS
    //   )
    // ) {
    //   throw createError(500, 'This operations already in progress');
    // }

    const operation = new Operation(params);

    this.operations.push(operation);

    // TODO: store in DB

    return operation.toObject();
  };

  getOperationById = (id: string) => {
    const operation = this.operations.find(operation => operation.id === id);

    if (operation) {
      return operation.toObject();
    }

    return null;
  };

  setActionHash = (params: { operationId: string; actionId: string; transactionHash: string }) => {
    const operation = this.operations.find(o => o.id === params.operationId);

    if (!operation) {
      throw createError(400, 'Operation not found');
    }

    const action = operation.actions.find(a => a.id === params.actionId);

    if (!action) {
      throw createError(400, 'Action not found');
    }

    action.setTransactionHash(params.transactionHash);

    return operation.toObject();
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
