import Web3 from 'web3';
import { EthMethods } from './EthMethods';
import { EthMethodsERC20 } from './EthMethodsERC20';
import { EthManager } from './EthManager';

import ethManagerJson = require('../contracts/LINKEthManager.json');
import erc20Json = require('../contracts/MyERC20.json');
import multiSigWalletJson = require('../contracts/MultiSigWallet.json');
import busdJson = require('../contracts/IBUSD.json');
import ethManagerERC20Json = require('../contracts/EthManagerERC20.json');
import { sleep } from '../utils';

export * from './EthMethods';
export * from './EthMethodsERC20';

export const web3URL = process.env.ETH_NODE_URL;
export const web3URLWS = process.env.ETH_NODE_URL_WS;

/**
 * Refreshes provider instance and attaches even handlers to it
 */

let provider = new Web3.providers.WebsocketProvider(web3URLWS);

function refreshProvider(web3Obj, providerUrl) {
  let retries = 0;

  function retry(event = null) {
    if (event) {
      console.log('Web3 provider disconnected or errored.');
      retries += 1;

      if (retries > 5) {
        console.log(`Max retries of 5 exceeding: ${retries} times tried`);
        return setTimeout(() => refreshProvider(web3Obj, providerUrl), 5000);
      }
    } else {
      console.log(`Reconnecting web3 provider ${providerUrl}`);
      refreshProvider(web3Obj, providerUrl);
    }

    return null;
  }

  provider = new Web3.providers.WebsocketProvider(providerUrl);

  provider.on('end', () => retry());
  provider.on('error', () => retry());

  web3Obj.setProvider(provider);

  console.log('New Web3 provider initiated');

  return provider;
}

export const web3 = new Web3(web3URL);
export const web3WS = new Web3();

refreshProvider(web3WS, web3URLWS);

const ping = async () => {
  while (true) {
    if (provider) {
      web3WS.eth.net.isListening().catch(() => {
        refreshProvider(web3WS, web3URLWS);
      });
    }
    await sleep(3000);
  }
};

ping();

const ethManagerBUSD = new EthManager(ethManagerJson, process.env.ETH_BUSD_MANAGER_CONTRACT);
const ethTokenBUSD = new EthManager(busdJson, process.env.ETH_BUSD_CONTRACT);

const ethManagerLINK = new EthManager(ethManagerJson, process.env.ETH_LINK_MANAGER_CONTRACT);
const ethTokenLINK = new EthManager(erc20Json, process.env.ETH_LINK_CONTRACT);

const ethMultiSigWallet = new EthManager(multiSigWalletJson, process.env.ETH_MULTISIG_WALLET);

export const ethMethodsBUSD = new EthMethods({
  web3,
  ethManager: ethManagerBUSD,
  ethMultiSigManager: ethMultiSigWallet,
  ethToken: ethTokenBUSD,
});

export const ethMethodsLINK = new EthMethods({
  web3,
  ethManager: ethManagerLINK,
  ethMultiSigManager: ethMultiSigWallet,
  ethToken: ethTokenLINK,
});

const ethManagerERC20 = new EthManager(ethManagerERC20Json, process.env.ETH_ERC20_MANAGER_CONTRACT);

export const ethMethodsERC20 = new EthMethodsERC20({
  web3,
  ethManager: ethManagerERC20,
  ethMultiSigManager: ethMultiSigWallet,
  ethToken: ethTokenBUSD,
});
