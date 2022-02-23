"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UndoBoxType_1 = __importDefault(require("./UndoBoxType"));
class UndoBox {
    constructor({ key, type = UndoBoxType_1.default.AUTO, autoBox = true, autoHandleData = true, callback = (data) => {
    }, vm }) {
        // 撤销栈
        this.undo_stack = [];
        // 重做栈
        this.redo_stack = [];
        // 冻结计数
        this.freeze = 0;
        // 运行状态
        this.running = false;
        // 停止监听方法
        this.unwatch = () => {
            throw new Error('unwatch is undefined');
        };
        this.key = key;
        this._vm = vm;
        this.type = type;
        this.autoHandleData = autoHandleData;
        this.callback = callback;
        if (autoBox) {
            this.box();
        }
    }
    /**
     * 重置数据
     * @private
     */
    _reset() {
        this.undo_stack = [];
        this.redo_stack = [];
        this.freeze = 0;
        this.running = false;
    }
    /**
     * 开始监听
     */
    box() {
        if (this.running) {
            return;
        }
        this._reset();
        this.undo_stack.push(JSON.stringify(this._vm.$data[this.key]));
        this.running = true;
        if (this.type === UndoBoxType_1.default.MANUAL) {
            return;
        }
        this.unwatch = this._vm.$watch(this.key, (val) => {
            if (this.freeze > 0) {
                this.freeze--;
                return;
            }
            this.undo_stack.push(JSON.stringify(val));
            this.redo_stack = [];
        }, {
            deep: true
        });
    }
    record() {
        if (this.type === UndoBoxType_1.default.AUTO) {
            return;
        }
        this.undo_stack.push(JSON.stringify(this._vm.$data[this.key]));
    }
    /**
     * 停止监听
     */
    unbox() {
        this._reset();
        this.unwatch();
    }
    /**
     * 撤销
     */
    undo() {
        if (typeof this.undo_stack === "undefined" || this.undo_stack === null || this.undo_stack.length <= 1) {
            return;
        }
        if (this.type === UndoBoxType_1.default.AUTO) {
            this.freeze++;
        }
        let pop = this.undo_stack.pop();
        if (pop == undefined) {
            return;
        }
        this.redo_stack.push(pop);
        let data = JSON.parse(this.undo_stack[this.undo_stack.length - 1]);
        this.defaultHandle(data);
    }
    /**
     * 重做
     */
    redo() {
        if (typeof this.redo_stack === "undefined" || this.redo_stack === null || this.redo_stack.length === 0) {
            return;
        }
        if (this.type === UndoBoxType_1.default.AUTO) {
            this.freeze++;
        }
        let pop = this.redo_stack.pop();
        if (pop === undefined) {
            return;
        }
        this.undo_stack.push(pop);
        let data = JSON.parse(pop);
        this.defaultHandle(data);
    }
    /**
     * 默认行为
     * @param data
     * @private
     */
    defaultHandle(data) {
        if (this.autoHandleData) {
            this.defaultHandleDataChange(data);
        }
        this.callback(data);
    }
    /**
     * 默认处理数据方法
     * @param data
     * @private
     */
    defaultHandleDataChange(data) {
        this._vm.$set(this._vm, this.key, data);
    }
}
exports.default = UndoBox;
