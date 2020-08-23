import Web3 from 'web3';

export const web3URL = process.env.ETH_NODE_URL;

export const web3 = new Web3(web3URL);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethBUSDJson = require('../contracts/BUSDImplementation.json');
const ethBUSDJsonAbi: any = ethBUSDJson.abi;

export const ethBUSDContract = new web3.eth.Contract(ethBUSDJsonAbi, process.env.ETH_BUSD_CONTRACT);

// eslint-disable-next-line @typescript-eslint/no-var-requires
import ethManagerJson = require('../contracts/BUSDEthManager.json');
const ethManagerJsonAbi: any = ethManagerJson.abi;

export const managerContract = new web3.eth.Contract(
  ethManagerJsonAbi,
  process.env.ETH_MANAGER_CONTRACT
);
