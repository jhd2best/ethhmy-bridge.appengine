import { Action } from './Action';
import { ACTION_TYPE, OPERATION_TYPE } from './interfaces';
import { HmyMethods, hmyMethodsBUSD, hmyMethodsLINK } from '../../blockchain/hmy';
import { ethMethodsBUSD, ethMethodsLINK, EthMethods } from '../../blockchain/eth';
import { IOperationInitParams } from './Operation';
import { createError } from '../../routes/helpers';

const ethToOne = (hmyMethods: HmyMethods, ethMethods: EthMethods) => {
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
      const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);
      if (approvalLog.spender != ethMethods.ethManager.address) {
        throw new Error('approvalLog.spender != process.env.ETH_MANAGER_CONTRACT');
      }
      const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);
      if (lockTokenLog.amount != approvalLog.value) {
        throw new Error('lockTokenLog.amount != approvalLog.value');
      }
      return hmyMethods.mintToken(
        lockTokenLog.recipient,
        lockTokenLog.amount,
        lockTokenAction.transactionHash
      );
    },
  });

  return [approveEthMangerAction, lockTokenAction, waitingBlockNumberAction, mintTokenAction];
};

const hmyToEth = (hmyMethods: HmyMethods, ethMethods: EthMethods) => {
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
      const approvalLog = hmyMethods.decodeApprovalLog(approveHmyMangerAction.payload);

      if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
        throw new Error('approvalLog.spender != hmyManager.address');
      }

      const burnTokenLog = hmyMethods.decodeBurnTokenLog(burnTokenAction.payload);

      if (burnTokenLog.amount != approvalLog.value) {
        throw new Error('burnTokenLog.amount != approvalLog.value');
      }

      return ethMethods.unlockToken(
        burnTokenLog.recipient,
        burnTokenLog.amount,
        burnTokenAction.transactionHash
      );
    },
  });

  return [approveHmyMangerAction, burnTokenAction, unlockTokenAction];
};

export const generateActionsPool = (
  type: OPERATION_TYPE,
  params: IOperationInitParams
): Array<Action> => {
  switch (params.type) {
    case OPERATION_TYPE.BUSD_ETH_ONE:
      return ethToOne(hmyMethodsBUSD, ethMethodsBUSD);

    case OPERATION_TYPE.LINK_ETH_ONE:
      return ethToOne(hmyMethodsLINK, ethMethodsLINK);

    case OPERATION_TYPE.BUSD_ONE_ETH:
      return hmyToEth(hmyMethodsBUSD, ethMethodsBUSD);

    case OPERATION_TYPE.LINK_ONE_ETH:
      return hmyToEth(hmyMethodsLINK, ethMethodsLINK);

    default:
      throw createError(500, 'Operation type not found');
  }
};
