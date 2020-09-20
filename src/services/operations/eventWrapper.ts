import { EventsConstructor } from '../../blockchain/helpers/EventsConstructor';

export const eventWrapper = (
  events: EventsConstructor,
  eventName: string,
  transactionHash: string,
  func: () => Promise<any>
): Promise<{
  status: boolean;
  transactionHash?: string;
}> => {
  return new Promise<{
    status: boolean;
    transactionHash?: string;
  }>(async (resolve, reject) => {
    try {
      let res;
      let resEvent;

      const returnResult = () => {
        if (res && res.status !== true) {
          console.log('Action rejected: ', eventName, transactionHash);
          reject(res);
        }

        const isWsConnected = events.isWSConnected();
        console.log('isWsConnected: ', isWsConnected);
        const hasEvent = !isWsConnected || resEvent;

        if (res && res.status === true && hasEvent) {
          console.log('Action success: ', eventName, transactionHash);
          resolve(resEvent || res);
        }
      };

      events.subscribe({
        event: eventName,
        success: event => {
          resEvent = event;
          returnResult();
        },
        failed: err => reject(err.error),
        condition: event => event.returnValues.receiptId === transactionHash,
      });

      res = await func();

      console.log('Res status: ', eventName, res.status);

      returnResult();
    } catch (e) {
      reject({ status: false, error: e.message });
    }
  });
};
