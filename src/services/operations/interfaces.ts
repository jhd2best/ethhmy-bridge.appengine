export enum OPERATION_TYPE {
  ETH_ONE = 'eth_to_one',
  ONE_ETH = 'one_to_eth',
}

export enum ACTION_TYPE {
  // ETH_TO_ONE
  'getHRC20Address' = 'getHRC20Address',
  'approveEthManger' = 'approveEthManger',
  'lockToken' = 'lockToken',
  'waitingBlockNumber' = 'waitingBlockNumber',
  'mintToken' = 'mintToken',

  // ONE_TO_ETH
  'approveHmyManger' = 'approveHmyManger',
  'burnToken' = 'burnToken',
  'unlockToken' = 'unlockToken',
}

export enum STATUS {
  ERROR = 'error',
  SUCCESS = 'success',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
}
