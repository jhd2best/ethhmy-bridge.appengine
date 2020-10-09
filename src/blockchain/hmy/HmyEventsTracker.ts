import { uuidv4 } from '../../services/utils';
import { IEventData } from '../helpers/EventsConstructor';
import { Harmony } from '@harmony-js/core';
import { Messenger, HttpProvider } from '@harmony-js/network';
import Web3 from 'web3';
import { HmyManager } from './HmyManager';
import { sleep } from '../utils';

const CHECK_EVENTS_INTERVAL = 10000;

interface IEthEventTrackerParams {
  hmyManagerMultiSig: HmyManager;
  hmySdk: Harmony;
}

interface IGetEventsParams {
  manager: HmyManager;
  event: string;
  fromBlock: number;
  toBlock: number;
}

type EventHandler = (event: IEventData) => void;

export class HmyEventsTracker {
  lastBlock = 0;
  hmyManagerMultiSig: HmyManager;
  hmySdk: Harmony;
  web3: Web3;
  logsMessenger: Messenger;

  subscribers: Record<string, EventHandler> = {};
  tracks: Record<
    string,
    { eventName: string; manager: HmyManager; eventHandler: EventHandler }
  > = {};

  constructor(params: IEthEventTrackerParams) {
    this.hmySdk = params.hmySdk;
    this.hmyManagerMultiSig = params.hmyManagerMultiSig;
    this.web3 = new Web3(`${process.env.ETH_NODE_URL}`);
    this.logsMessenger = new Messenger(new HttpProvider(process.env.HMY_NODE_URL));

    setInterval(this.checkEvents, CHECK_EVENTS_INTERVAL);
  }

  public onEventHandler = (callback: EventHandler) => {
    const id = uuidv4();

    this.subscribers[id] = callback;
  };

  public addTrack = (eventName: string, manager: HmyManager, eventHandler: EventHandler) => {
    const id = uuidv4();

    this.tracks[id] = { manager, eventName, eventHandler };
  };

  getEvents = async (params: IGetEventsParams) => {
    const topicAddress = params.manager.contract.abiModel.getEvent(params.event).signature;
    let res = { result: [] };

    try {
      res = await this.logsMessenger.send('hmy_getLogs', [
        {
          fromBlock: '0x' + params.fromBlock.toString(16),
          toBlock: '0x' + params.toBlock.toString(16),
          address: params.manager.address,
          topics: [topicAddress],
        },
      ]);
    } catch (e) {
      console.log('Error get HMY logs: ', e && e.message);

      await sleep(5000);

      this.logsMessenger = new Messenger(new HttpProvider(process.env.HMY_NODE_URL));

      res = await this.logsMessenger.send('hmy_getLogs', [
        {
          fromBlock: '0x' + params.fromBlock.toString(16),
          toBlock: '0x' + params.toBlock.toString(16),
          address: params.manager.address,
          topics: [topicAddress],
        },
      ]);
    }

    const logs = res.result;

    return logs.map(log => ({
      ...log,
      event: params.event,
      returnValues: this.web3.eth.abi.decodeLog(
        params.manager.contract.abiModel.getEvent(params.event).inputs,
        log.data,
        log.topics.slice(1)
      ),
    }));
  };

  private checkEvents = async () => {
    const res = await this.hmySdk.blockchain.getBlockNumber();
    const latest = Number(res.result);

    if (!this.lastBlock) {
      this.lastBlock = latest - 1000;
    }

    if (latest > this.lastBlock) {
      const submissionEvents = await this.getEvents({
        manager: this.hmyManagerMultiSig,
        event: 'Submission',
        fromBlock: this.lastBlock,
        toBlock: latest,
      });

      if (submissionEvents.length) {
        console.log('New HMY submission events: ', submissionEvents.length);
      }

      submissionEvents.forEach(async event => {
        const transaction = await this.hmyManagerMultiSig.contract.methods
          .transactions(event.returnValues.transactionId)
          .call();

        Object.values(this.subscribers).forEach(eventHandler =>
          eventHandler({ ...event, transaction })
        );
      });

      Object.values(this.tracks).map(async track => {
        const events = await this.getEvents({
          manager: track.manager,
          event: track.eventName,
          fromBlock: this.lastBlock,
          toBlock: latest,
        });

        if (events.length) {
          console.log('New HMY minted events: ', events.length);
        }

        events.forEach(track.eventHandler);
      });

      this.lastBlock = latest;
    }
  };
}
