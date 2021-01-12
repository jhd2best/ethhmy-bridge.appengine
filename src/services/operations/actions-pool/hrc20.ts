import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { IOperationInitParams } from '../Operation';
import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { eventWrapper } from './eventWrapper';

import logger from '../../../logger';
const log = logger.module('validator:Erc20ActionPool');

export const hmyToEthHRC20 = (
  hmyMethods: hmyContract.HmyMethodsHRC20,
  ethMethods: ethContract.EthMethodsHRC20,
  params: IOperationInitParams
) => {
  const getHRC20AddressAction = new Action({
    type: ACTION_TYPE.getERC20Address,
    callFunction: async () => {
      let transaction = {};
      let hrc20Address = await ethMethods.getMappingFor(params.hrc20Address);

      if (!Number(hrc20Address)) {
        const [name, symbol, decimals] = await hmyMethods.tokenDetails(params.hrc20Address);
        transaction = await ethMethods.addToken(params.hrc20Address, name, '1' + symbol, decimals);
        hrc20Address = await ethMethods.getMappingFor(params.hrc20Address);
      }

      return { ...transaction, status: true, hrc20Address };
    },
  });

  const approveEthMangerAction = new Action({
    type: ACTION_TYPE.approveHRC20HmyManger,
    awaitConfirmation: true,
    callFunction: async hash => await hmyMethods.getTransactionReceipt(hash),
  });

  const lockTokenAction = new Action({
    type: ACTION_TYPE.lockHRC20Token,
    awaitConfirmation: true,
    callFunction: async hash => await hmyMethods.getTransactionReceipt(hash),
  });

  // const waitingBlockNumberAction = new Action({
  //   type: ACTION_TYPE.waitingBlockNumber,
  //   callFunction: () =>
  //     ethMethods.waitingBlockNumber(
  //       lockTokenAction.payload.blockNumber,
  //       lockTokenAction.payload.transactionHash,
  //       msg => (waitingBlockNumberAction.message = msg)
  //     ),
  // });

  const mintTokenAction = new Action({
    type: ACTION_TYPE.mintHRC20Token,
    startRollbackOnFail: true,
    callFunction: () => {
      return eventWrapper(ethMethods, 'Minted', lockTokenAction.transactionHash, async () => {
        const approvalLog = hmyMethods.decodeApprovalLog(approveEthMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
          throw new Error(
            'approvalLog.spender != process.env.ETH_MANAGER_CONTRACT' +
              ':' +
              approvalLog.spender +
              ':' +
              hmyMethods.hmyManager.address
          );
        }

        const lockTokenLog = hmyMethods.decodeLockTokenLog(lockTokenAction.payload);

        if (lockTokenLog.amount != approvalLog.value) {
          throw new Error('lockTokenLog.amount != approvalLog.value');
        }

        const erc20Address = await ethMethods.getMappingFor(lockTokenLog.token);

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
        const approvalLog = hmyMethods.decodeApprovalLog(approveEthMangerAction.payload);

        if (approvalLog.spender.toUpperCase() != hmyMethods.hmyManager.address.toUpperCase()) {
          throw new Error(
            'approvalLog.spender != process.env.ETH_MANAGER_CONTRACT' +
              ':' +
              approvalLog.spender +
              ':' +
              hmyMethods.hmyManager.address
          );
        }

        const lockTokenLog = hmyMethods.decodeLockTokenLog(lockTokenAction.payload);

        if (lockTokenLog.amount != approvalLog.value) {
          throw new Error('lockTokenLog.amount != approvalLog.value');
        }

        log.info('unlockTokenRollbackAction', {
          lockTokenLog,
          approvalLog,
          transactionHash: lockTokenAction.transactionHash,
        });

        return await hmyMethods.unlockToken(
          lockTokenLog.token,
          lockTokenLog.sender,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  return {
    actions: [
      getHRC20AddressAction,
      approveEthMangerAction,
      lockTokenAction,
      // waitingBlockNumberAction,
      mintTokenAction,
    ],
    rollbackActions: [unlockTokenRollbackAction],
  };
};

export const ethToOneHRC20 = (
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
          params.hrc20Address,
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );

        return await hmyMethods.unlockToken(
          // burnTokenLog.token ??
          params.hrc20Address,
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
