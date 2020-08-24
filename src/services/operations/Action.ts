import { uuidv4 } from '../utils';
import { ACTION_TYPE, STATUS } from './interfaces';
import { createError } from '../../routes/helpers';
import { sleep } from '../../blockchain/utils';
import { TransactionReceipt } from 'web3-core';

export type TActionCallFunction = (
  props?: any
) => Promise<{
  status: boolean;
  transactionHash?: string;
}>;

export interface IActionInitParams {
  type: ACTION_TYPE;
  callFunction: TActionCallFunction;
  awaitConfirmation?: boolean;
}

export class Action {
  id: string;
  type: ACTION_TYPE;
  status: STATUS;
  transactionHash: string;
  error: string;
  message: string;
  timestamp: number;
  payload: TransactionReceipt;
  awaitConfirmation: boolean;

  callFunction: TActionCallFunction;

  constructor(params: IActionInitParams) {
    this.id = uuidv4();
    this.status = STATUS.WAITING;
    this.type = params.type;
    this.callFunction = params.callFunction;
    this.awaitConfirmation = !!params.awaitConfirmation;
  }

  public call = async () => {
    if (this.awaitConfirmation) {
      while (!this.transactionHash) {
        await sleep(1000);
      }
    }

    this.status = STATUS.IN_PROGRESS;
    this.timestamp = Math.round(+new Date() / 1000);

    try {
      let res;

      if (this.awaitConfirmation) {
        while (!res) {
          res = await this.callFunction(this.transactionHash);
          await sleep(1000);
        }
      } else {
        res = await this.callFunction();
      }

      this.transactionHash = res.transactionHash;
      this.payload = res;

      if (res.status === true) {
        this.status = STATUS.SUCCESS;

        return true;
      } else {
        this.error = 'Tx status not success';
      }
    } catch (e) {
      this.error = e.message;
    }

    this.status = STATUS.ERROR;

    return false;
  };

  public setTransactionHash = (transactionHash: string) => {
    if (this.awaitConfirmation && !this.transactionHash) {
      this.transactionHash = transactionHash;
    } else {
      throw createError(500, 'Transaction hash already saved');
    }
  };

  public toObject = () => ({
    id: this.id,
    type: this.type,
    status: this.status,
    transactionHash: this.transactionHash,
    error: this.error,
    message: this.message,
    timestamp: this.timestamp,
    // payload: this.payload,
  });
}
