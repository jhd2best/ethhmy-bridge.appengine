import { Action } from '../Action';
import { OPERATION_TYPE, TOKEN } from '../interfaces';
import { createError } from '../../../routes/helpers';
import { IOperationInitParams } from '../Operation';

import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { ethToOne, hmyToEth } from './base';
import { ethToOneERC20, hmyToEthERC20 } from './erc20';
import { ethToOneETH, hmyToEthETH } from './1Eth';
import { ethToOneERC721, hmyToEthERC721 } from './erc721';
import { ethToOneHRC20, hmyToEthHRC20 } from './hrc20';

export const generateActionsPool = (
  params: IOperationInitParams
): { actions: Array<Action>; rollbackActions: Array<Action> } => {
  if (params.type === OPERATION_TYPE.ONE_ETH) {
    switch (params.token) {
      case TOKEN.BUSD:
        return hmyToEth(hmyContract.hmyMethodsBUSD, ethContract.ethMethodsBUSD);
      case TOKEN.LINK:
        return hmyToEth(hmyContract.hmyMethodsLINK, ethContract.ethMethodsLINK);
      case TOKEN.ERC20:
        return hmyToEthERC20(hmyContract.hmyMethodsERC20, ethContract.ethMethodsERC20, params);
      case TOKEN.HRC20:
        return hmyToEthHRC20(hmyContract.hmyMethodsHRC20, ethContract.ethMethodsHRC20, params);
      case TOKEN.ETH:
        return hmyToEthETH(hmyContract.hmyMethodsERC20, ethContract.ethMethodsETH, params);
      case TOKEN.ERC721:
        return hmyToEthERC721(hmyContract.hmyMethodsERC721, ethContract.ethMethodsERC721, params);
    }
  }

  if (params.type === OPERATION_TYPE.ETH_ONE) {
    switch (params.token) {
      case TOKEN.BUSD:
        return ethToOne(hmyContract.hmyMethodsBUSD, ethContract.ethMethodsBUSD);
      case TOKEN.LINK:
        return ethToOne(hmyContract.hmyMethodsLINK, ethContract.ethMethodsLINK);
      case TOKEN.ERC20:
        return ethToOneERC20(hmyContract.hmyMethodsERC20, ethContract.ethMethodsERC20, params);
      case TOKEN.HRC20:
        return ethToOneHRC20(hmyContract.hmyMethodsHRC20, ethContract.ethMethodsHRC20, params);
      case TOKEN.ETH:
        return ethToOneETH(hmyContract.hmyMethodsERC20, ethContract.ethMethodsETH, params);
      case TOKEN.ERC721:
        return ethToOneERC721(hmyContract.hmyMethodsERC721, ethContract.ethMethodsERC721, params);
    }
  }

  throw createError(500, 'Operation or token type not found');
};
