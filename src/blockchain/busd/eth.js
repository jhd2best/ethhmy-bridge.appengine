"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.waitingBlockNumber = exports.unlockToken = exports.lockToken = exports.approveEthManger = void 0;
var ethSdk_1 = require("../ethSdk");
var bn_js_1 = require("bn.js");
var utils_1 = require("../utils");
var addAccount = function (privateKey) {
    var ethMasterAccount = ethSdk_1.web3.eth.accounts.privateKeyToAccount(privateKey);
    ethSdk_1.web3.eth.accounts.wallet.add(ethMasterAccount);
    return ethMasterAccount;
};
function approveEthManger(amount) {
    return __awaiter(this, void 0, void 0, function () {
        var account, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    account = addAccount('0x694f76fae42a33b853054e950699de8e552e2e6b5bb7178404c73095c648da21');
                    _b = (_a = ethSdk_1.ethBUSDContract.methods.approve(process.env.ETH_MANAGER_CONTRACT, amount)).send;
                    _c = {
                        from: account.address,
                        gas: process.env.ETH_GAS_LIMIT
                    };
                    _d = bn_js_1["default"].bind;
                    return [4 /*yield*/, ethSdk_1.web3.eth.getGasPrice()];
                case 1: return [4 /*yield*/, _b.apply(_a, [(_c.gasPrice = new (_d.apply(bn_js_1["default"], [void 0, _e.sent()]))().mul(new bn_js_1["default"](1)),
                            _c)])];
                case 2: return [2 /*return*/, _e.sent()];
            }
        });
    });
}
exports.approveEthManger = approveEthManger;
function lockToken(userAddr, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var account, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    account = addAccount('0x694f76fae42a33b853054e950699de8e552e2e6b5bb7178404c73095c648da21');
                    _b = (_a = ethSdk_1.managerContract.methods.lockToken(amount, userAddr)).send;
                    _c = {
                        from: account.address,
                        gas: process.env.ETH_GAS_LIMIT
                    };
                    _d = bn_js_1["default"].bind;
                    return [4 /*yield*/, ethSdk_1.web3.eth.getGasPrice()];
                case 1: return [4 /*yield*/, _b.apply(_a, [(_c.gasPrice = new (_d.apply(bn_js_1["default"], [void 0, _e.sent()]))().mul(new bn_js_1["default"](1)),
                            _c)])];
                case 2: return [2 /*return*/, _e.sent()];
            }
        });
    });
}
exports.lockToken = lockToken;
function unlockToken(userAddr, amount, receiptId) {
    return __awaiter(this, void 0, void 0, function () {
        var ethMasterAccount, _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    ethMasterAccount = addAccount(process.env.ETH_MASTER_PRIVATE_KEY);
                    _b = (_a = ethSdk_1.managerContract.methods.unlockToken(amount, userAddr, receiptId)).send;
                    _c = {
                        from: ethMasterAccount.address,
                        gas: process.env.ETH_GAS_LIMIT
                    };
                    _d = bn_js_1["default"].bind;
                    return [4 /*yield*/, ethSdk_1.web3.eth.getGasPrice()];
                case 1: return [4 /*yield*/, _b.apply(_a, [(_c.gasPrice = new (_d.apply(bn_js_1["default"], [void 0, _e.sent()]))().mul(new bn_js_1["default"](1)),
                            _c)])];
                case 2: return [2 /*return*/, _e.sent()];
            }
        });
    });
}
exports.unlockToken = unlockToken;
function waitingBlockNumber() {
    return __awaiter(this, void 0, void 0, function () {
        var lockedEventBlockNumber, expectedBlockNumber, blockNumber;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ethSdk_1.web3.eth.getBlockNumber()];
                case 1:
                    lockedEventBlockNumber = _a.sent();
                    expectedBlockNumber = lockedEventBlockNumber + utils_1.BLOCK_TO_FINALITY;
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, ethSdk_1.web3.eth.getBlockNumber()];
                case 3:
                    blockNumber = _a.sent();
                    if (!(blockNumber <= expectedBlockNumber)) return [3 /*break*/, 5];
                    console.log("Currently at block " + blockNumber + ", waiting for block " + expectedBlockNumber + " to be confirmed");
                    return [4 /*yield*/, utils_1.sleep(utils_1.AVG_BLOCK_TIME)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5: return [3 /*break*/, 7];
                case 6: return [3 /*break*/, 2];
                case 7: return [2 /*return*/, { status: true }];
            }
        });
    });
}
exports.waitingBlockNumber = waitingBlockNumber;
