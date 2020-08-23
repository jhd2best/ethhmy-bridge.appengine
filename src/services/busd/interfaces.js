"use strict";
exports.__esModule = true;
exports.STATUS = exports.ACTION_TYPE = exports.OPERATION_TYPE = void 0;
var OPERATION_TYPE;
(function (OPERATION_TYPE) {
    OPERATION_TYPE["BUSD_ETH_ONE"] = "busd_eth_one";
    OPERATION_TYPE["BUSD_ONE_ETH"] = "busd_one_eth";
})(OPERATION_TYPE = exports.OPERATION_TYPE || (exports.OPERATION_TYPE = {}));
var ACTION_TYPE;
(function (ACTION_TYPE) {
    // ETH_TO_ONE
    ACTION_TYPE["approveEthManger"] = "approveEthManger";
    ACTION_TYPE["lockToken"] = "lockToken";
    ACTION_TYPE["waitingBlockNumber"] = "waitingBlockNumber";
    ACTION_TYPE["mintToken"] = "mintToken";
    // ONE_TO_ETH
    ACTION_TYPE["approveHmyManger"] = "approveHmyManger";
    ACTION_TYPE["burnToken"] = "burnToken";
    ACTION_TYPE["unlockToken"] = "unlockToken";
})(ACTION_TYPE = exports.ACTION_TYPE || (exports.ACTION_TYPE = {}));
var STATUS;
(function (STATUS) {
    STATUS["ERROR"] = "error";
    STATUS["SUCCESS"] = "success";
    STATUS["WAITING"] = "waiting";
    STATUS["IN_PROGRESS"] = "in_progress";
})(STATUS = exports.STATUS || (exports.STATUS = {}));
