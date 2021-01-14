import { TransactionReceipt } from 'web3-core';
import erc20Json = require('../contracts/MyERC721.json');
import { EthMethodsBase } from './EthMethodsBase';
import { encodeUnlockTokenErc721, encodeUnlockTokensErc721 } from './eth-encoders';

export class EthMethodsERC721 extends EthMethodsBase {
  decodeLockTokenLog = (receipt: TransactionReceipt) => {
    return this.web3.eth.abi.decodeLog(
      [
        {
          indexed: true,
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'recipient',
          type: 'address',
        },
      ],
      receipt.logs[receipt.logs.length - 1].data,
      receipt.logs[receipt.logs.length - 1].topics.slice(1)
    );
  };

  decodeLockTokensLog = (receipt: TransactionReceipt) => {
    const res = [];

    receipt.logs.forEach(log => {
      try {
        const result = this.web3.eth.abi.decodeLog(
          [
            {
              indexed: true,
              internalType: 'address',
              name: 'token',
              type: 'address',
            },
            {
              indexed: true,
              internalType: 'address',
              name: 'sender',
              type: 'address',
            },
            {
              indexed: false,
              internalType: 'uint256',
              name: 'amount',
              type: 'uint256',
            },
            {
              indexed: false,
              internalType: 'address',
              name: 'recipient',
              type: 'address',
            },
          ],
          log.data,
          log.topics.slice(1)
        );

        res.push(result);
      } catch (e) {}
    });

    return { ...res[0], tokenIds: res.map(log => log.amount) };
  };

  unlockToken = async (erc721Address, userAddr, tokenId, receiptId) => {
    console.log('before unlockTokenErc721: ', receiptId);

    const data = encodeUnlockTokenErc721(erc721Address, tokenId, userAddr, receiptId);
    return await this.submitTxEth(data);
  };

  unlockTokens = async (erc721Address, userAddr, tokenIds, receiptId) => {
    console.log('before unlockTokenErc721: ', receiptId);

    const data = encodeUnlockTokensErc721(erc721Address, tokenIds, userAddr, receiptId);
    return await this.submitTxEth(data);
  };

  tokenDetails = async contract => {
    const erc20Contract = new this.web3.eth.Contract(erc20Json.abi as any, contract);
    return [
      await erc20Contract.methods.name().call(),
      await erc20Contract.methods.symbol().call(),
      await erc20Contract.methods.baseURI().call(),
    ];
  };
}
