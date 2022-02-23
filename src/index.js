"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoBox = void 0;
const UndoBox_1 = __importDefault(require("./UndoBox"));
const UndoBoxType_1 = __importDefault(require("./UndoBoxType"));
const undoBox = function ({ key, type = UndoBoxType_1.default.AUTO, autoBox = true, autoHandleData = true, callback }) {
    return new UndoBox_1.default({
        key,
        type,
        autoBox,
        autoHandleData,
        callback,
        vm: this
    });
};
exports.undoBox = undoBox;
const install = function (Vue, opts) {
    Vue.prototype.$undoBox = exports.undoBox;
};
exports.default = {
    install
};
