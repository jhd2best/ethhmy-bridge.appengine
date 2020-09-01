import { DBService } from '../database';
import { IOperationInitParams, Operation } from './Operation';
import { createError } from '../../routes/helpers';

export interface IOperationService {
  database: DBService;
}

export class OperationService {
  database: DBService;

  dbCollectionName = 'operations';

  operations: Operation[] = [];

  constructor(params: IOperationService) {
    this.database = params.database;

    this.restoreOperationsFromDB();
  }

  restoreOperationsFromDB = async () => {
    const operations = await this.database.getCollectionData(this.dbCollectionName);

    operations.forEach(operationDB => {
      const operation = new Operation(operationDB, this.saveOperationToDB);

      this.operations.push(operation);
    });
  };

  saveOperationToDB = async (operation: Operation) => {
    await this.database.updateDocument(this.dbCollectionName, operation.id, operation.toObject());
  };

  create = async (params: IOperationInitParams) => {
    // if (
    //   this.operations.some(
    //     op => op.ethAddress === params.ethAddress && op.status === STATUS.IN_PROGRESS
    //   )
    // ) {
    //   throw createError(500, 'This operations already in progress');
    // }

    const operation = new Operation(
      {
        type: params.type,
        token: params.token,
        ethAddress: params.ethAddress,
        oneAddress: params.oneAddress,
        actions: params.actions,
        amount: params.amount,
        fee: params.fee,
      },
      this.saveOperationToDB
    );

    await this.saveOperationToDB(operation);

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
      .map(operation => operation.toObject())
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  };
}
