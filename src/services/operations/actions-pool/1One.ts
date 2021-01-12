import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { IOperationInitParams } from '../Operation';
import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { eventWrapper } from './eventWrapper';

import logger from '../../../logger';
const log = logger.module('validator:1ETHActionsPool');

export const ethToOneONE = (
  hmyMethods: hmyContract.HmyMethodsHRC20,
  ethMethods: ethContract.EthMethodsHRC20,
  params: IOperationInitParams
) => {
  const approveEthMangerAction = new Action({
    type: ACTION_TYPE.approveHRC20EthManger,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.waitTransaction(hash),
  });

  const burnTokenAction = new Action({
    type: ACTION_TYPE.burnHRC20Token,
    awaitConfirmation: true,
    callFunction: hash => ethMethods.waitTransaction(hash),
  });

  const waitingBlockNumberAction = new Action({
    type: ACTION_TYPE.waitingBlockNumber,
    callFunction: () =>
      ethMethods.waitingBlockNumber(
        burnTokenAction.payload.blockNumber,
        burnTokenAction.payload.transactionHash,
        msg => (waitingBlockNumberAction.message = msg)
      ),
  });

  const unlockTokenAction = new Action({
    type: ACTION_TYPE.unlockHRC20Token,
    startRollbackOnFail: true,
    callFunction: () => {
      return eventWrapper(hmyMethods, 'Unlocked', burnTokenAction.transactionHash, async () => {
        const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != ethMethods.ethManager.address.toUpperCase()) {
          throw new Error('approvalLog.spender != hmyManager.address');
        }

        const burnTokenLog = ethMethods.decodeBurnTokenLog(burnTokenAction.payload);

        if (burnTokenLog.amount != approvalLog.value) {
          throw new Error('burnTokenLog.amount != approvalLog.value');
        }

        console.log(
          'before unlockToken',
          params.erc20Address,
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );

        return await hmyMethods.unlockTokenOne(
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      });
    },
  });

  const mintTokenRollbackAction = new Action({
    type: ACTION_TYPE.mintHRC20TokenRollback,
    callFunction: () => {
      return eventWrapper(ethMethods, 'Minted', burnTokenAction.transactionHash, async () => {
        const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != ethMethods.ethManager.address.toUpperCase()) {
          throw new Error('approvalLog.spender != hmyManager.address');
        }

        const burnTokenLog = ethMethods.decodeBurnTokenLog(burnTokenAction.payload);

        if (burnTokenLog.amount != approvalLog.value) {
          throw new Error('burnTokenLog.amount != approvalLog.value');
        }

        log.info('mintTokenRollbackAction', {
          burnTokenLog,
          approvalLog,
          transactionHash: burnTokenAction.transactionHash,
        });

        return await ethMethods.mintERC20Token(
          burnTokenLog.token,
          burnTokenLog.sender,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [approveEthMangerAction, burnTokenAction, waitingBlockNumberAction, unlockTokenAction],
    rollbackActions: [mintTokenRollbackAction],
  };
};

export const hmyToEthONE = (
  hmyMethods: hmyContract.HmyMethodsHRC20,
  ethMethods: ethContract.EthMethodsHRC20,
  params: IOperationInitParams
) => {
  const lockTokenAction = new Action({
    type: ACTION_TYPE.lockHRC20Token,
    awaitConfirmation: true,
    callFunction: async hash => await hmyMethods.getTransactionReceipt(hash),
  });

  const mintTokenAction = new Action({
    type: ACTION_TYPE.mintHRC20Token,
    startRollbackOnFail: true,
    callFunction: () => {
      return eventWrapper(ethMethods, 'Minted', lockTokenAction.transactionHash, async () => {
        const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);

        // if (Number(lockTokenLog.amount) != Number(params.amount)) {
        //   throw new Error('lockTokenLog.amount != params.amount');
        // }

        const hrc20Address = process.env.ETH_HRC20;

        return await ethMethods.mintERC20Token(
          hrc20Address,
          lockTokenLog.recipient,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  const unlockTokenRollbackAction = new Action({
    type: ACTION_TYPE.unlockHRC20TokenRollback,
    callFunction: () => {
      return eventWrapper(hmyMethods, 'Unlocked', lockTokenAction.transactionHash, async () => {
        const lockTokenLog = ethMethods.decodeLockTokenLog(lockTokenAction.payload);

        if (lockTokenLog.amount != params.amount) {
          throw new Error('lockTokenLog.amount != params.amount');
        }

        return await hmyMethods.unlockTokenOne(
          lockTokenLog.sender,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [lockTokenAction, mintTokenAction],
    rollbackActions: [unlockTokenRollbackAction],
  };
};
