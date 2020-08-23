import { uuidv4 } from '../utils';
import { ACTION_TYPE, STATUS } from './interfaces';

export type TActionCallFunction = () => Promise<{
  status: boolean;
  transactionHash?: string;
}>;

export interface IActionInitParams {
  type: ACTION_TYPE;
  callFunction: TActionCallFunction;
}

export class Action {
  id: string;
  type: ACTION_TYPE;
  status: STATUS;
  transactionHash: string;
  error: string;
  message: string;
  timestamp: number;
  payload: any;

  callFunction: TActionCallFunction;

  constructor(params: IActionInitParams) {
    this.id = uuidv4();
    this.status = STATUS.WAITING;
    this.type = params.type;
    this.callFunction = params.callFunction;
  }

  public call = async () => {
    this.status = STATUS.IN_PROGRESS;
    this.timestamp = Math.round(+new Date() / 1000);

    try {
      const res = await this.callFunction();

      this.transactionHash = res.transactionHash;
      this.payload = res;

      if (res.status === true) {
        this.status = STATUS.SUCCESS;

        return true;
      }
    } catch (e) {
      this.error = e.message;
    }

    this.status = STATUS.ERROR;

    return false;
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
