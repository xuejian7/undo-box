"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UndoBox {
    constructor({ key, autoBox = true, autoHandleData = true, callback = (data) => {
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
        this.running = true;
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
        this.freeze++;
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
        this.freeze++;
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
