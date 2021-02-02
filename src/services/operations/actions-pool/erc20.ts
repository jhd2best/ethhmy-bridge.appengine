import * as hmyContract from '../../../blockchain/hmy';
import * as ethContract from '../../../blockchain/eth';
import { IOperationInitParams } from '../Operation';
import { Action } from '../Action';
import { ACTION_TYPE } from '../interfaces';
import { eventWrapper } from './eventWrapper';

import logger from '../../../logger';
const log = logger.module('validator:Erc20ActionPool');

export const ethToOneERC20 = (
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
        transaction = await hmyMethods.addToken(params.erc20Address, name, '1' + symbol, decimals);
        hrc20Address = await hmyMethods.getMappingFor(params.erc20Address);
      }

      return { ...transaction, status: true, hrc20Address };
    },
  });

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

        const erc20Address = await hmyMethods.getMappingFor(lockTokenLog.token);

        return await hmyMethods.mintToken(
          erc20Address,
          lockTokenLog.recipient,
          lockTokenLog.amount,
          lockTokenAction.transactionHash
        );
      });
    },
  });

  const unlockTokenRollbackAction = new Action({
    type: ACTION_TYPE.unlockTokenRollback,
    callFunction: () => {
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
      waitingBlockNumberAction,
      mintTokenAction,
    ],
    rollbackActions: [unlockTokenRollbackAction],
  };
};

export const hmyToEthERC20 = (
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

        console.log(
          'before unlockToken',
          params.erc20Address,
          burnTokenLog.recipient,
          burnTokenLog.amount,
          burnTokenAction.transactionHash
        );

        return await ethMethods.unlockToken(
          params.erc20Address,
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
          burnTokenLog.token,
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
