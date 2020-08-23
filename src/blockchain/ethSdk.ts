import Web3 from 'web3';

export const web3URL = process.env.ETH_NODE_URL;

export const web3 = new Web3(web3URL);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ethBUSDJson = require('../contracts/BUSDImplementation.json');
export const ethBUSDContract = new web3.eth.Contract(
  ethBUSDJson.abi,
  process.env.ETH_BUSD_CONTRACT
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const EthManagerJson = require('../contracts/BUSDEthManager.json');
export const managerContract = new web3.eth.Contract(
  EthManagerJson.abi,
  process.env.ETH_MANAGER_CONTRACT
);
