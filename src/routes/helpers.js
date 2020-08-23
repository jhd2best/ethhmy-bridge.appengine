"use strict";
exports.__esModule = true;
exports.createError = exports.asyncHandler = void 0;
exports.asyncHandler = function (fn) { return function (req, res, next) {
    return Promise.resolve(fn(req, res, next))["catch"](next);
}; };
exports.createError = function (status, message) {
    var error = new Error(message);
    error.status = status;
    return error;
};
