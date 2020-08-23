"use strict";
exports.__esModule = true;
exports.BUSDService = void 0;
var Operation_1 = require("./Operation");
var BUSDService = /** @class */ (function () {
    function BUSDService(params) {
        var _this = this;
        this.operations = [];
        this.create = function (params) {
            var operation = new Operation_1.Operation(params);
            _this.operations.push(operation);
            return operation.toObject();
        };
        this.getOperationById = function (id) {
            var operation = _this.operations.find(function (operation) { return operation.id === id; });
            if (operation) {
                return operation.toObject();
            }
            return null;
        };
        this.getAllOperations = function (params) {
            return _this.operations
                .filter(function (operation) {
                var hasEthAddress = params.ethAddress ? params.ethAddress === operation.ethAddress : true;
                var hasOneAddress = params.oneAddress ? params.oneAddress === operation.oneAddress : true;
                return hasEthAddress && hasOneAddress;
            })
                .map(function (operation) { return operation.toObject(); });
        };
        this.database = params.database;
    }
    return BUSDService;
}());
exports.BUSDService = BUSDService;
