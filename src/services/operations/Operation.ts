import { uuidv4 } from '../utils';
import { ACTION_TYPE, OPERATION_TYPE, STATUS } from './interfaces';
import { Action } from './Action';
import * as eth from '../../blockchain/busd/eth';
import * as hmy from '../../blockchain/busd/hmy';
import { error } from 'util';
import { createError } from '../../routes/helpers';

export interface IOperationInitParams {
  type: OPERATION_TYPE;
  ethAddress: string;
  oneAddress: string;
  actions: Record<ACTION_TYPE, string>;
  amount: string;
}

export class Operation {
  id: string;
  type: OPERATION_TYPE;
  status: STATUS;
  ethAddress: string;
  oneAddress: string;
  amount: string;
  actions: Action[];

  constructor(params: IOperationInitParams) {
    this.id = uuidv4();
    this.status = STATUS.WAITING;

    this.oneAddress = params.oneAddress;
    this.ethAddress = params.ethAddress;
    this.amount = params.amount;

    switch (params.type) {
      case OPERATION_TYPE.BUSD_ETH_ONE:
        this.BUSD_ETH_ONE(params);
        break;

      case OPERATION_TYPE.BUSD_ONE_ETH:
        break;

      default:
        throw createError(500, 'Action type not found');
    }

    this.startActionsPool();
  }

  BUSD_ETH_ONE = (params: IOperationInitParams) => {
    const approveEthMangerAction = new Action({
      type: ACTION_TYPE.approveEthManger,
      awaitConfirmation: true,
      callFunction: hash => eth.getTransactionReceipt(hash),
    });

    const lockTokenAction = new Action({
      type: ACTION_TYPE.lockToken,
      awaitConfirmation: true,
      callFunction: hash => eth.getTransactionReceipt(hash),
    });

    const waitingBlockNumberAction = new Action({
      type: ACTION_TYPE.waitingBlockNumber,
      callFunction: () =>
        eth.waitingBlockNumber(
          lockTokenAction.payload.blockNumber,
          msg => (waitingBlockNumberAction.message = msg)
        ),
    });

    // TODO: get past logs to fetch the lockToken tx hash and recipient

    const mintTokenAction = new Action({
      type: ACTION_TYPE.mintToken,
      callFunction: () =>
        hmy.mintToken(params.oneAddress, params.amount, lockTokenAction.transactionHash),
    });

    this.actions = [
      approveEthMangerAction,
      lockTokenAction,
      waitingBlockNumberAction,
      mintTokenAction,
    ];
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

      const res = await action.call();

      if (!res) {
        this.status = STATUS.ERROR;
        return;
      }

      actionIndex++;
    }

    this.status = STATUS.SUCCESS;
  };

  toObject = () => {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      amount: this.amount,
      ethAddress: this.ethAddress,
      oneAddress: this.oneAddress,
      actions: this.actions.map(a => a.toObject()),
    };
  };
}
