import { uuidv4 } from '../utils';
import { ACTION_TYPE, OPERATION_TYPE, STATUS } from './interfaces';
import { Action } from './Action';
import * as eth from '../../blockchain/busd/eth';

export interface IOperationInitParams {
  type: OPERATION_TYPE;
  ethAddress: string;
  oneAddress: string;
  actions: Array<{
    type: ACTION_TYPE;
    raw: string;
  }>;
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
        const approveEthMangerAction = new Action({
          type: ACTION_TYPE.approveEthManger,
          callFunction: () => eth.approveEthManger(this.amount),
        });

        const lockTokenAction = new Action({
          type: ACTION_TYPE.lockToken,
          callFunction: () => eth.lockToken(this.ethAddress, this.amount),
        });

        const waitingBlockNumberAction = new Action({
          type: ACTION_TYPE.waitingBlockNumber,
          callFunction: async () => eth.waitingBlockNumber(),
        });

        this.actions = [approveEthMangerAction, lockTokenAction, waitingBlockNumberAction];
        break;

      case OPERATION_TYPE.BUSD_ONE_ETH:
        break;
    }

    this.startActionsPool();
  }

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
