export enum OPERATION_TYPE {
  ETH_ONE = 'eth_to_one',
  ONE_ETH = 'one_to_eth',
}

export enum TOKEN {
  BUSD = 'busd',
  LINK = 'link',
  ERC20 = 'erc20',
  HRC20 = 'hrc20',
  ETH = 'eth',
  ONE = 'one',
  ERC721 = 'erc721',
}

export enum ACTION_TYPE {
  // ETH_TO_ONE
  'getHRC20Address' = 'getHRC20Address',
  'approveEthManger' = 'approveEthManger',
  'lockToken' = 'lockToken',
  'waitingBlockNumber' = 'waitingBlockNumber',
  'mintToken' = 'mintToken',
  'mintTokenRollback' = 'mintTokenRollback',

  // ONE_TO_ETH
  'approveHmyManger' = 'approveHmyManger',
  'burnToken' = 'burnToken',
  'waitingBlockNumberHarmony' = 'waitingBlockNumberHarmony',
  'unlockToken' = 'unlockToken',
  'unlockTokenRollback' = 'unlockTokenRollback',

  // HRC20
  'approveHRC20HmyManger' = 'approveHRC20HmyManger',
  'approveHRC20EthManger' = 'approveHRC20EthManger',
  'getERC20Address' = 'getERC20Address',
  'lockHRC20Token' = 'lockHRC20Token',
  'unlockHRC20Token' = 'unlockHRC20Token',
  'burnHRC20Token' = 'burnHRC20Token',
  'mintHRC20Token' = 'mintHRC20Token',
  'unlockHRC20TokenRollback' = 'unlockHRC20TokenRollback',
  'mintHRC20TokenRollback' = 'mintHRC20TokenRollback',
}

export enum STATUS {
  ERROR = 'error',
  SUCCESS = 'success',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  CANCELED = 'canceled',
}
