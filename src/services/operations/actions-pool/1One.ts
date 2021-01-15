import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { IOperationInitParams } from '../Operation';
import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { eventWrapper } from './eventWrapper';

import logger from '../../../logger';
import { sleep } from '../../../blockchain/utils';
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

        const erc20Address = await ethMethods.getMappingFor(process.env.ONE_HRC20);

        if (erc20Address.toUpperCase() != burnTokenLog.token.toUpperCase()) {
          throw new Error('Bad token address');
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
  const oneHrc20Address = process.env.ONE_HRC20;

  const getHRC20AddressAction = new Action({
    type: ACTION_TYPE.getERC20Address,
    callFunction: async () => {
      let transaction = {};
      let erc20Address = await ethMethods.getMappingFor(oneHrc20Address);

      if (!Number(erc20Address)) {
        transaction = await ethMethods.addToken(oneHrc20Address, 'Harmony ONE', '1ONE', 18);

        let maxAwaitTime = 20 * 60 * 1000; // 20min

        while (!Number(erc20Address) && maxAwaitTime > 0) {
          await sleep(3000);
          maxAwaitTime = maxAwaitTime - 3000;
          erc20Address = await ethMethods.getMappingFor(oneHrc20Address);
        }
      }

      return { ...transaction, status: true, hrc20Address: oneHrc20Address, erc20Address };
    },
  });

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
        const lockTokenLog = ethMethods.decodeLockTokenOneLog(lockTokenAction.payload);

        const erc20Address = await ethMethods.getMappingFor(process.env.ONE_HRC20);

        return await ethMethods.mintERC20Token(
          erc20Address,
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
        const lockTokenLog = ethMethods.decodeLockTokenOneLog(lockTokenAction.payload);

        return await hmyMethods.unlockTokenOne(
          lockTokenAction.payload.from,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [getHRC20AddressAction, lockTokenAction, mintTokenAction],
    rollbackActions: [unlockTokenRollbackAction],
  };
};
