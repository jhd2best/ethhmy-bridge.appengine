import { uuidv4 } from '../utils';
import { ACTION_TYPE, OPERATION_TYPE, STATUS } from './interfaces';
import { Action } from './Action';
import * as eth from '../../blockchain/busd/eth';
import * as hmy from '../../blockchain/busd/hmy';

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
  lockedEvent: {
    status: boolean;
    transactionHash: string;
    returnValues: { recipient: string };
    blockNumber: number;
  };

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

      case OPERATION_TYPE.BUSD_ETH_ONE_TEST:
        this.BUSD_ETH_ONE_TEST();
        break;

      case OPERATION_TYPE.BUSD_ONE_ETH:
        break;
    }

    this.startActionsPool();
  }

  BUSD_ETH_ONE = (params: IOperationInitParams) => {
    const approveEthMangerAction = new Action({
      type: ACTION_TYPE.approveEthManger,
      callFunction: () => eth.sendSignedTransaction(params.actions.approveEthManger),
    });

    this.actions = [approveEthMangerAction];
  };

  BUSD_ETH_ONE_TEST = () => {
    const approveEthMangerAction = new Action({
      type: ACTION_TYPE.approveEthManger,
      callFunction: () => eth.approveEthManger(this.amount),
    });

    const lockTokenAction = new Action({
      type: ACTION_TYPE.lockToken,
      callFunction: async () => {
        this.lockedEvent = await eth.lockToken(this.ethAddress, this.amount);
        return this.lockedEvent;
      },
    });

    const waitingBlockNumberAction = new Action({
      type: ACTION_TYPE.waitingBlockNumber,
      callFunction: () =>
        eth.waitingBlockNumber(this.lockedEvent, msg => (waitingBlockNumberAction.message = msg)),
    });

    const mintTokenAction = new Action({
      type: ACTION_TYPE.mintToken,
      callFunction: () =>
        hmy.mintToken(
          this.lockedEvent.returnValues.recipient,
          this.amount,
          this.lockedEvent.transactionHash
        ),
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
