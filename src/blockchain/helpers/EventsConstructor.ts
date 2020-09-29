import { uuidv4 } from '../../services/utils';
import { hmyWSProvider } from '../hmy';

interface IError {
  error: string;
  status: boolean;
}

// oneToken: string;
// amount: string;
// recipient: string;
// receiptId: string;

interface IMintEvent {
  address: string;
  blockNumber: number;
  transactionHash: string;
  blockHash: string;
  returnValues: any;
  event: string;
  error?: string;
  status: boolean;
}

export class EventsConstructor {
  subscribers: Record<
    string,
    {
      event: string;
      success: (event: IMintEvent) => void;
      failed: (event: IError) => void;
      condition: (event: IMintEvent) => boolean;
    }
  > = {};

  eventHandler = (event: IMintEvent) => {
    Object.keys(this.subscribers).forEach(id => {
      const sub = this.subscribers[id];

      console.log('New Event: ', event.event, event.returnValues);

      if (sub.event === event.event && sub.condition(event)) {
        sub.success({ ...event, status: true });
        this.unsubscribe(id);
      }
    });
  };

  eventErrorHandler = (e: any) => {
    console.log('-- eventErrorHandler --');
    // Object.keys(this.subscribers).forEach(id => {
    //   this.subscribers[id].failed({ error: e.message, status: false });
    //   this.unsubscribe(id);
    // });
  };

  public subscribe = (params: {
    event: string;
    success: (event: IMintEvent) => void;
    failed: (event: IError) => void;
    condition: (event: IMintEvent) => boolean;
  }) => {
    const id = uuidv4();

    this.subscribers[id] = params;

    return id;
  };

  public unsubscribe = (id: string) => {
    delete this.subscribers[id];
  };

  isWSConnected = () => {
    return false;
  };
}
