import { EventsConstructor } from '../../blockchain/helpers/EventsConstructor';
import logger from '../../logger';
const log = logger.module('validator:eventWrapper');

const WAIT_TIMEOUT = 10 * 60 * 1000; // 10 min

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

      const timerId = setTimeout(() => {
        log.error(`${eventName}: action rejected by timeout`, { eventName, transactionHash, res });
        reject({ status: false, error: 'Rejected by timeout' });
      }, WAIT_TIMEOUT);

      events.subscribe({
        event: eventName,
        success: event => {
          clearTimeout(timerId);
          resolve({ ...event, status: true });
        },
        failed: err => reject(err.error),
        condition: event => event.returnValues.receiptId === transactionHash,
      });

      res = await func();

      if (!res || res.status !== true) {
        log.warn(`${eventName}: action rejected`, { eventName, transactionHash, res });
      }
    } catch (e) {
      log.error(`${eventName}: exception error`, { eventName, error: e, transactionHash });
      reject({ status: false, error: e.message });
    }
  });
};
