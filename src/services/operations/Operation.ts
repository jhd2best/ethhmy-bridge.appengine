import { uuidv4 } from '../utils';
import { ACTION_TYPE, OPERATION_TYPE, STATUS } from './interfaces';
import { Action } from './Action';
import * as ethActions from '../../blockchain/busd/eth';
import * as hmyActions from '../../blockchain/busd/hmy';
import { createError } from '../../routes/helpers';

export interface IOperationInitParams {
  id?: string;
  status?: STATUS;
  type: OPERATION_TYPE;
  ethAddress: string;
  oneAddress: string;
  actions?: Array<Action>;
  amount: string;
}

export type TSyncOperationCallback = (operation: Operation) => Promise<void>;

export class Operation {
  id: string;
  type: OPERATION_TYPE;
  status: STATUS;
  ethAddress: string;
  oneAddress: string;
  amount: string;
  actions: Action[];

  syncOperationCallback: TSyncOperationCallback;

  constructor(params: IOperationInitParams, callback: TSyncOperationCallback) {
    this.oneAddress = params.oneAddress;
    this.ethAddress = params.ethAddress;
    this.amount = params.amount;
    this.type = params.type;

    this.syncOperationCallback = callback;

    switch (params.type) {
      case OPERATION_TYPE.BUSD_ETH_ONE:
        this.BUSD_ETH_ONE(params);
        break;

      case OPERATION_TYPE.BUSD_ONE_ETH:
        this.BUSD_ONE_ETH(params);
        break;

      default:
        throw createError(500, 'Operation type not found');
    }

    if (params.id) {
      // init from DB
      this.id = params.id;
      this.status = params.status;

      this.actions.forEach(action => {
        const actionFromDB = params.actions.find(a => a.type === action.type);

        if (actionFromDB) {
          action.setParams(actionFromDB);
        }
      });
    } else {
      this.id = uuidv4();
      this.status = STATUS.WAITING;
    }

    if (this.status === STATUS.WAITING || this.status === STATUS.IN_PROGRESS) {
      this.startActionsPool();
    }
  }

  BUSD_ETH_ONE = (params: IOperationInitParams) => {
    const approveEthMangerAction = new Action({
      type: ACTION_TYPE.approveEthManger,
      awaitConfirmation: true,
      callFunction: hash => ethActions.getTransactionReceipt(hash),
    });

    const lockTokenAction = new Action({
      type: ACTION_TYPE.lockToken,
      awaitConfirmation: true,
      callFunction: hash => ethActions.getTransactionReceipt(hash),
    });

    const waitingBlockNumberAction = new Action({
      type: ACTION_TYPE.waitingBlockNumber,
      callFunction: () =>
        ethActions.waitingBlockNumber(
          lockTokenAction.payload.blockNumber,
          msg => (waitingBlockNumberAction.message = msg)
        ),
    });

    const mintTokenAction = new Action({
      type: ACTION_TYPE.mintToken,
      callFunction: () => {
        const approvalLog = ethActions.decodeApprovalLog(approveEthMangerAction.payload);
        if (approvalLog.spender != process.env.ETH_MANAGER_CONTRACT) {
          return new Promise(resolve => {
            resolve(null);
          });
        }
        const lockTokenLog = ethActions.decodeLockTokenLog(lockTokenAction.payload);
        if (lockTokenLog.amount != approvalLog.value) {
          return new Promise(resolve => {
            resolve(null);
          });
        }
        return hmyActions.mintToken(
          lockTokenLog.recipient,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      },
    });

    this.actions = [
      approveEthMangerAction,
      lockTokenAction,
      waitingBlockNumberAction,
      mintTokenAction,
    ];
  };

  BUSD_ONE_ETH = (params: IOperationInitParams) => {
    const approveHmyMangerAction = new Action({
      type: ACTION_TYPE.approveHmyManger,
      awaitConfirmation: true,
      callFunction: hash => hmyActions.getTransactionReceipt(hash),
    });

    const burnTokenAction = new Action({
      type: ACTION_TYPE.burnToken,
      awaitConfirmation: true,
      callFunction: hash => hmyActions.getTransactionReceipt(hash),
    });

    // TODO: unlockToken return success status, but tokens not transfer

    const unlockTokenAction = new Action({
      type: ACTION_TYPE.unlockToken,
      callFunction: () => {
        const approvalLog = hmyActions.decodeApprovalLog(approveHmyMangerAction.payload);
        if (approvalLog.spender.toUpperCase() != process.env.HMY_MANAGER_CONTRACT.toUpperCase()) {
          return new Promise(resolve => {
            resolve(null);
          });
        }
        const burnTokenLog = hmyActions.decodeBurnTokenLog(burnTokenAction.payload);
        if (burnTokenLog.amount != approvalLog.value) {
          return new Promise(resolve => {
            resolve(null);
          });
        }
        return ethActions.unlockToken(
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      },
    });

    this.actions = [approveHmyMangerAction, burnTokenAction, unlockTokenAction];
  };

  startActionsPool = async () => {
    let actionIndex = 0;

    // TODO: add mode for continue operation loading from DB
    if (this.actions.some(a => a.status !== STATUS.WAITING)) {
      return;
    }

    this.status = STATUS.IN_PROGRESS;

    while (this.actions[actionIndex]) {
      const action = this.actions[actionIndex];

      if (action.status === STATUS.WAITING) {
        const res = await action.call();

        if (!res) {
          this.status = STATUS.ERROR;
          await this.syncOperationCallback(this);
          return;
        }

        await this.syncOperationCallback(this);
      }

      actionIndex++;
    }

    this.status = STATUS.SUCCESS;

    await this.syncOperationCallback(this);
  };

  toObject = (params?: { payload?: boolean }) => {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      amount: this.amount,
      ethAddress: this.ethAddress,
      oneAddress: this.oneAddress,
      actions: this.actions.map(a => a.toObject(params)),
    };
  };
}
