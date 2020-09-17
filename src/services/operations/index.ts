import { DBService } from '../database';
import { IOperationInitParams, Operation } from './Operation';
import { createError } from '../../routes/helpers';
import { STATUS, OPERATION_TYPE } from './interfaces';
import { hmy } from '../../blockchain/hmy';
import { normalizeEthKey } from '../../blockchain/utils';
import { validateEthBalanceNonZero, validateOneBalanceNonZero } from './validations';

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
    await this.database.updateDocument(
      this.dbCollectionName,
      operation.id,
      operation.toObject({ payload: true })
    );
  };

  validateOperationBeforeCreate = async (params: IOperationInitParams) => {
    const normalizeOne = v => hmy.crypto.getAddress(v).checksum;

    if (
      this.operations.some(
        op =>
          normalizeEthKey(op.ethAddress) === normalizeEthKey(params.ethAddress) &&
          normalizeOne(op.oneAddress) === normalizeOne(params.oneAddress) &&
          op.type === params.type &&
          op.erc20Address === params.erc20Address &&
          op.status === STATUS.IN_PROGRESS &&
          Date.now() - op.timestamp * 1000 < 1000 * 120 // 120 sec
      )
    ) {
      throw createError(500, 'This operation already in progress');
    }

    try {
      switch (params.type) {
        case OPERATION_TYPE.ONE_ETH:
          await validateOneBalanceNonZero(params.oneAddress);
          break;
        case OPERATION_TYPE.ETH_ONE:
          await validateEthBalanceNonZero(params.ethAddress);
          break;
        default:
          throw createError(400, 'Invalid operation type');
      }
    } catch (e) {
      throw createError(500, 'User eth balance is to low');
    }

    return true;
  };

  create = async (params: IOperationInitParams) => {
    await this.validateOperationBeforeCreate(params);

    const operation = new Operation(
      {
        type: params.type,
        erc20Address: params.erc20Address,
        ethAddress: params.ethAddress,
        oneAddress: params.oneAddress,
        actions: params.actions,
        amount: params.amount,
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
      .map(operation => operation.toObject({ payload: true }))
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  };
}
