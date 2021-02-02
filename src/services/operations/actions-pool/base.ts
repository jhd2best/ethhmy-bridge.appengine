import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { eventWrapper } from './eventWrapper';

import logger from '../../../logger';
const log = logger.module('validator:BaseActionPool');

export const ethToOne = (
  hmyMethods: hmyContract.HmyMethods,
  ethMethods: ethContract.EthMethods
) => {
  const approveEthMangerAction = new Action({
    type: ACTION_TYPE.approveEthManger,
    awaitConfirmation: true,
    callFunction: async hash => await ethMethods.waitTransaction(hash),
  });

  const lockTokenAction = new Action({
    type: ACTION_TYPE.lockToken,
    awaitConfirmation: true,
    callFunction: async hash => await ethMethods.waitTransaction(hash),
  });

  const waitingBlockNumberAction = new Action({
    type: ACTION_TYPE.waitingBlockNumber,
    callFunction: () =>
      ethMethods.waitingBlockNumber(
        lockTokenAction.payload.blockNumber,
        lockTokenAction.payload.transactionHash,
        msg => (waitingBlockNumberAction.message = msg)
      ),
  });

  const mintTokenAction = new Action({
    type: ACTION_TYPE.mintToken,
    startRollbackOnFail: true,
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

  const unlockTokenRollbackAction = new Action({
    type: ACTION_TYPE.unlockTokenRollback,
    callFunction: async () => {
      return eventWrapper(ethMethods, 'Unlocked', lockTokenAction.transactionHash, async () => {
        const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);
        if (approvalLog.spender != ethMethods.ethManager.address) {
          throw new Error('approvalLog.spender != process.env.ETH_MANAGER_CONTRACT');
        }

        const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);
        if (lockTokenLog.amount != approvalLog.value) {
          throw new Error('lockTokenLog.amount != approvalLog.value');
        }

        log.info('unlockTokenRollbackAction', {
          lockTokenLog,
          approvalLog,
          transactionHash: lockTokenAction.transactionHash,
        });

        return await ethMethods.unlockToken(
          lockTokenLog.sender,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [approveEthMangerAction, lockTokenAction, waitingBlockNumberAction, mintTokenAction],
    rollbackActions: [unlockTokenRollbackAction],
  };
};

export const hmyToEth = (
  hmyMethods: hmyContract.HmyMethods,
  ethMethods: ethContract.EthMethods
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

  // const waitingBlockNumberAction = new Action({
  //   type: ACTION_TYPE.waitingBlockNumberHarmony,
  //   callFunction: () =>
  //     hmyMethods.waitingBlockNumber(
  //       Number(burnTokenAction.payload.blockNumber),
  //       burnTokenAction.payload.transactionHash,
  //       msg => (waitingBlockNumberAction.message = msg)
  //     ),
  // });

  const unlockTokenAction = new Action({
    type: ACTION_TYPE.unlockToken,
    startRollbackOnFail: true,
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

  const mintTokenRollbackAction = new Action({
    type: ACTION_TYPE.mintTokenRollback,
    callFunction: () => {
      return eventWrapper(hmyMethods, 'Minted', burnTokenAction.transactionHash, async () => {
        const approvalLog = hmyMethods.decodeApprovalLog(approveHmyMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
          throw new Error('approvalLog.spender != hmyManager.address');
        }

        const burnTokenLog = hmyMethods.decodeBurnTokenLog(burnTokenAction.payload);

        if (burnTokenLog.amount != approvalLog.value) {
          throw new Error('burnTokenLog.amount != approvalLog.value');
        }

        log.info('mintTokenRollbackAction', {
          burnTokenLog,
          approvalLog,
          transactionHash: burnTokenAction.transactionHash,
        });

        return await hmyMethods.mintToken(
          burnTokenLog.sender,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [approveHmyMangerAction, burnTokenAction, unlockTokenAction],
    rollbackActions: [mintTokenRollbackAction],
  };
};
