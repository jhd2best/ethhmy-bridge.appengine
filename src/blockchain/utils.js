"use strict";
exports.__esModule = true;
exports.normalizeEthKey = exports.sleep = exports.AVG_BLOCK_TIME = exports.BLOCK_TO_FINALITY = void 0;
exports.BLOCK_TO_FINALITY = 13;
exports.AVG_BLOCK_TIME = 20 * 1000;
exports.sleep = function (duration) { return new Promise(function (res) { return setTimeout(res, duration); }); };
function normalizeEthKey(key) {
    var result = key.toLowerCase();
    if (!result.startsWith('0x')) {
        result = '0x' + result;
    }
    return result;
}
exports.normalizeEthKey = normalizeEthKey;
