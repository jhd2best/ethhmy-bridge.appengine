import { hmyManagerContract } from '../hmySdk';

// async function approveHmyManger(contractAddr, managerAddr, amount) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const hmyBUSDJson = require('../out/BUSDImplementation.json');
//       let hmyBUSDContract = hmy.contracts.createContract(
//         hmyBUSDJson.abi,
//         contractAddr,
//       );
//
//       // hmyBUSDContract.wallet.setSigner(process.env.ONE_USER);
//
//       await connectToOneWallet(hmyBUSDContract.wallet, null, reject);
//
//       let options = { gasPrice: 1000000000, gasLimit: 6721900 };
//
//       const res = await hmyBUSDContract.methods
//         .approve(managerAddr, amount)
//         .send(options);
//
//       resolve(res);
//     } catch (e) {
//       reject(e);
//     }
//   });
// }
//
// async function burnToken(managerAddr, userAddr, amount) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const hmyManagerJson = require('../out/BUSDHmyManager.json');
//       let hmyManagerContract = hmy.contracts.createContract(
//         hmyManagerJson.abi,
//         managerAddr,
//       );
//
//       // hmyBUSDContract.wallet.setSigner(process.env.ONE_USER);
//
//       await connectToOneWallet(hmyManagerContract.wallet, null, reject);
//
//       let options = { gasPrice: 1000000000, gasLimit: 6721900 };
//
//       let response = await hmyManagerContract.methods
//         .burnToken(amount, userAddr)
//         .send(options);
//
//       resolve(response.transaction.id);
//     } catch (e) {
//       reject(e);
//     }
//   });
// }

const options = { gasPrice: 1000000000, gasLimit: 6721900 };

async function mintToken(userAddr, amount, receiptId) {
  const res = await hmyManagerContract.methods.mintToken(amount, userAddr, receiptId).send(options);

  return {
    ...res.transaction,
    status: res.status === 'called',
    transactionHash: res.transaction.id,
  };
}

export {
  // approveHmyManger,
  // burnToken,
  mintToken,
};
