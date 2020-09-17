import { Action } from './Action';
import { ACTION_TYPE, OPERATION_TYPE } from './interfaces';
import { HmyMethods, hmyMethods } from '../../blockchain/hmy';
import { ethMethods, EthMethods } from '../../blockchain/eth';
import { createError } from '../../routes/helpers';
import { IOperationInitParams } from './Operation';

const ethToOne = (hmyMethods: HmyMethods, ethMethods: EthMethods, params: IOperationInitParams) => {
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
    callFunction: () => {
      const approvalLog = ethMethods.decodeApprovalLog(approveEthMangerAction.payload);
      if (approvalLog.spender != ethMethods.ethManager.address) {
        throw new Error('approvalLog.spender != process.env.ETH_MANAGER_CONTRACT');
      }

      const hmyAddrHex = hmyMethods.hmySdk.crypto.getAddress(params.oneAddress).checksum;

      return ethMethods.lockTokenFor(
        params.erc20Address,
        params.ethAddress,
        params.amount,
        hmyAddrHex
      );
    },
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
      const { amount, recipient } = lockTokenAction.payload.returnValues;

      return hmyMethods.mintToken(
        getHRC20AddressAction.payload.hrc20Address,
        recipient,
        amount,
        lockTokenAction.transactionHash
      );
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

const hmyToEth = (hmyMethods: HmyMethods, ethMethods: EthMethods, params: IOperationInitParams) => {
  const getHRC20AddressAction = new Action({
    type: ACTION_TYPE.getHRC20Address,
    callFunction: async () => {
      let hrc20Address = await hmyMethods.getMappingFor(params.erc20Address);

      if (!hrc20Address) {
        const [name, symbol, decimals] = await ethMethods.tokenDetails(params.erc20Address);
        hrc20Address = await hmyMethods.addToken(params.erc20Address, name, symbol, decimals);
      }

      return { status: true, hrc20Address };
    },
  });

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

      console.log(1);
      const burnTokenLog = hmyMethods.decodeBurnTokenLog(burnTokenAction.payload);

      if (burnTokenLog.amount != approvalLog.value) {
        throw new Error('burnTokenLog.amount != approvalLog.value');
      }

      console.log(2);

      return ethMethods.unlockToken(
        params.erc20Address,
        burnTokenLog.recipient,
        burnTokenLog.amount,
        burnTokenAction.transactionHash
      );
    },
  });

  return [approveHmyMangerAction, burnTokenAction, unlockTokenAction];
};

export const generateActionsPool = (params: IOperationInitParams): Array<Action> => {
  switch (params.type) {
    case OPERATION_TYPE.ETH_ONE:
      return ethToOne(hmyMethods, ethMethods, params);

    case OPERATION_TYPE.ONE_ETH:
      return hmyToEth(hmyMethods, ethMethods, params);

    default:
      throw createError(500, 'Operation type not found');
  }
};
