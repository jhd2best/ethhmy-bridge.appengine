import { Action } from './Action';
import { ACTION_TYPE, OPERATION_TYPE, TOKEN } from './interfaces';
import { createError } from '../../routes/helpers';
import { IOperationInitParams } from './Operation';

import * as hmyContract from '../../blockchain/hmy';
import * as ethContract from '../../blockchain/eth';
import { eventWrapper } from './eventWrapper';

const ethToOneERC20 = (
  hmyMethods: hmyContract.HmyMethodsERC20,
  ethMethods: ethContract.EthMethodsERC20,
  params: IOperationInitParams
) => {
  const getHRC20AddressAction = new Action({
    type: ACTION_TYPE.getHRC20Address,
    callFunction: async () => {
      let transaction = {};
      let hrc20Address = await hmyMethods.getMappingFor(params.erc20Address);

      if (!Number(hrc20Address)) {
        const [name, symbol, decimals] = await ethMethods.tokenDetails(params.erc20Address);
        transaction = await hmyMethods.addToken(params.erc20Address, name, symbol, decimals);
        hrc20Address = await hmyMethods.getMappingFor(params.erc20Address);
      }

      return { ...transaction, status: true, hrc20Address };
    },
  });

  const approveEthMangerAction = new Action({
    type: ACTION_TYPE.approveEthManger,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.getTransactionReceipt(hash),
  });

  const lockTokenAction = new Action({
    type: ACTION_TYPE.lockToken,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.getTransactionReceipt(hash),
  });

  const waitingBlockNumberAction = new Action({
    type: ACTION_TYPE.waitingBlockNumber,
    callFunction: () =>
      ethMethods.waitingBlockNumber(
        lockTokenAction.payload.blockNumber,
        msg => (waitingBlockNumberAction.message = msg)
      ),
  });

  const mintTokenAction = new Action({
    type: ACTION_TYPE.mintToken,
    callFunction: () => {
      return eventWrapper(hmyMethods, 'Minted', lockTokenAction.transactionHash, async () => {
        const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);

        if (approvalLog.spender != ethMethods.ethManager.address) {
          throw new Error('approvalLog.spender != process.env.ETH_MANAGER_CONTRACT');
        }

        const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);

        if (lockTokenLog.amount != approvalLog.value) {
          throw new Error('lockTokenLog.amount != approvalLog.value');
        }

        return await hmyMethods.mintToken(
          getHRC20AddressAction.payload.hrc20Address,
          lockTokenLog.recipient,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return [
    getHRC20AddressAction,
    approveEthMangerAction,
    lockTokenAction,
    waitingBlockNumberAction,
    mintTokenAction,
  ];
};

const hmyToEthERC20 = (
  hmyMethods: hmyContract.HmyMethodsERC20,
  ethMethods: ethContract.EthMethodsERC20,
  params: IOperationInitParams
) => {
  const approveHmyMangerAction = new Action({
    type: ACTION_TYPE.approveHmyManger,
    awaitConfirmation: true,
    callFunction: hash => hmyMethods.getTransactionReceipt(hash),
  });

  const burnTokenAction = new Action({
    type: ACTION_TYPE.burnToken,
    awaitConfirmation: true,
    callFunction: hash => hmyMethods.getTransactionReceipt(hash),
  });

  const unlockTokenAction = new Action({
    type: ACTION_TYPE.unlockToken,
    callFunction: () => {
      return eventWrapper(ethMethods, 'Unlocked', burnTokenAction.transactionHash, async () => {
        const approvalLog = hmyMethods.decodeApprovalLog(approveHmyMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
          throw new Error('approvalLog.spender != hmyManager.address');
        }

        const burnTokenLog = hmyMethods.decodeBurnTokenLog(burnTokenAction.payload);

        if (burnTokenLog.amount != approvalLog.value) {
          throw new Error('burnTokenLog.amount != approvalLog.value');
        }

        return await ethMethods.unlockToken(
          params.erc20Address,
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      });
    },
  });

  return [approveHmyMangerAction, burnTokenAction, unlockTokenAction];
};

const ethToOne = (hmyMethods: hmyContract.HmyMethods, ethMethods: ethContract.EthMethods) => {
  const approveEthMangerAction = new Action({
    type: ACTION_TYPE.approveEthManger,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.getTransactionReceipt(hash),
  });

  const lockTokenAction = new Action({
    type: ACTION_TYPE.lockToken,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.getTransactionReceipt(hash),
  });

  const waitingBlockNumberAction = new Action({
    type: ACTION_TYPE.waitingBlockNumber,
    callFunction: () =>
      ethMethods.waitingBlockNumber(
        lockTokenAction.payload.blockNumber,
        msg => (waitingBlockNumberAction.message = msg)
      ),
  });

  const mintTokenAction = new Action({
    type: ACTION_TYPE.mintToken,
    callFunction: () => {
      return eventWrapper(hmyMethods, 'Minted', lockTokenAction.transactionHash, async () => {
        const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);
        if (approvalLog.spender != ethMethods.ethManager.address) {
          throw new Error('approvalLog.spender != process.env.ETH_MANAGER_CONTRACT');
        }

        const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);
        if (lockTokenLog.amount != approvalLog.value) {
          throw new Error('lockTokenLog.amount != approvalLog.value');
        }

        return await hmyMethods.mintToken(
          lockTokenLog.recipient,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return [approveEthMangerAction, lockTokenAction, waitingBlockNumberAction, mintTokenAction];
};

const hmyToEth = (hmyMethods: hmyContract.HmyMethods, ethMethods: ethContract.EthMethods) => {
  const approveHmyMangerAction = new Action({
    type: ACTION_TYPE.approveHmyManger,
    awaitConfirmation: true,
    callFunction: hash => hmyMethods.getTransactionReceipt(hash),
  });

  const burnTokenAction = new Action({
    type: ACTION_TYPE.burnToken,
    awaitConfirmation: true,
    callFunction: hash => hmyMethods.getTransactionReceipt(hash),
  });

  const unlockTokenAction = new Action({
    type: ACTION_TYPE.unlockToken,
    callFunction: async () => {
      return eventWrapper(ethMethods, 'Unlocked', burnTokenAction.transactionHash, async () => {
        const approvalLog = hmyMethods.decodeApprovalLog(approveHmyMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
          throw new Error('approvalLog.spender != hmyManager.address');
        }

        const burnTokenLog = hmyMethods.decodeBurnTokenLog(burnTokenAction.payload);

        if (burnTokenLog.amount != approvalLog.value) {
          throw new Error('burnTokenLog.amount != approvalLog.value');
        }

        return await ethMethods.unlockToken(
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      });
    },
  });

  return [approveHmyMangerAction, burnTokenAction, unlockTokenAction];
};

export const generateActionsPool = (params: IOperationInitParams): Array<Action> => {
  if (params.type === OPERATION_TYPE.ONE_ETH) {
    switch (params.token) {
      case TOKEN.BUSD:
        return hmyToEth(hmyContract.hmyMethodsBUSD, ethContract.ethMethodsBUSD);
      case TOKEN.LINK:
        return hmyToEth(hmyContract.hmyMethodsLINK, ethContract.ethMethodsLINK);
      case TOKEN.ERC20:
        return hmyToEthERC20(hmyContract.hmyMethodsERC20, ethContract.ethMethodsERC20, params);
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
    }
  }

  throw createError(500, 'Operation or token type not found');
};
