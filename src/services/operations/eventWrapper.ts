import { EventsConstructor } from '../../blockchain/helpers/EventsConstructor';
import logger from '../../logger';
const log = logger.module('validator:eventWrapper');

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
          log.warn(`${eventName}: action rejected`, { eventName, transactionHash });
          reject(res);
        }

        const isWsConnected = events.isWSConnected();
        const hasEvent = !isWsConnected || !!resEvent;
        // console.log('isWsConnected: ', isWsConnected);
        // const hasEvent = true;

        if (res && res.status === true && hasEvent) {
          // log.info('Action success', { eventName, transactionHash });
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

      // log.info('Action res status', { eventName, status: res.status });

      returnResult();
    } catch (e) {
      log.error(`${eventName}: exception error`, { eventName, error: e, transactionHash });
      reject({ status: false, error: e.message });
    }
  });
};
