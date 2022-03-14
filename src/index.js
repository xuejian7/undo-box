"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoBox = void 0;
const UndoBox_1 = __importDefault(require("./UndoBox"));
const undoBox = function ({ size = 100 }) {
    return new UndoBox_1.default(this, size);
};
exports.undoBox = undoBox;
const install = function (Vue, opts) {
    Vue.prototype.$undoBox = exports.undoBox;
};
exports.default = {
    install
};
