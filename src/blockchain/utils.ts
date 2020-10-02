import { KMS } from 'aws-sdk';
const readlineSync = require('readline-sync');
const BN = require('bn.js');

export const BLOCK_TO_FINALITY = 13;
export const AVG_BLOCK_TIME = 20 * 1000;
export const sleep = duration => new Promise(res => setTimeout(res, duration));

export function normalizeEthKey(key) {
  let result = key.toLowerCase();
  if (!result.startsWith('0x')) {
    result = '0x' + result;
  }
  return result;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const getAwsConfig = () => {
  return new KMS({
    accessKeyId: readlineSync.question('accessKeyId: ', { hideEchoBack: true }),
    secretAccessKey: readlineSync.question('secretAccessKey: ', { hideEchoBack: true }),
    region: readlineSync.question('region: ', { hideEchoBack: true }),
  });
};

export const awsKMS = getAwsConfig();

export const withDecimals = (amount: string | number, decimals: string | number) => {
  const decimalsMul = `10${new Array(Number(decimals)).join('0')}`;

  return new BN(amount).mul(new BN(decimalsMul));
};
